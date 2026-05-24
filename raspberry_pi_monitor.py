import json
import time
from datetime import datetime
from pathlib import Path

import requests
from gpiozero import DistanceSensor

try:
    import board
    import adafruit_dht
except ModuleNotFoundError:
    board = None
    adafruit_dht = None

try:
    import Adafruit_DHT
except ModuleNotFoundError:
    Adafruit_DHT = None


# =========================
# Config
# =========================
CONFIG_PATH = Path(__file__).with_name("device_config.json")


def load_config():
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(
            f"Config file not found: {CONFIG_PATH}\n"
            "Please create device_config.json first."
        )

    with CONFIG_PATH.open("r", encoding="utf-8") as file:
        config = json.load(file)

    required_keys = ["API_URL", "DEVICE_INGEST_TOKEN", "DEVICE_ID"]
    missing_keys = [key for key in required_keys if not config.get(key)]

    if missing_keys:
        raise ValueError(
            f"Missing required config values: {', '.join(missing_keys)}"
        )

    return config


CONFIG = load_config()

API_URL = CONFIG["API_URL"]
DEVICE_INGEST_TOKEN = CONFIG["DEVICE_INGEST_TOKEN"]
DEVICE_ID = CONFIG["DEVICE_ID"]
REQUEST_TIMEOUT_SEC = 10


# =========================
# Logging
# =========================
def log(level, message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")


def log_info(message):
    log("INFO", message)


def log_warn(message):
    log("WARN", message)


def log_error(message):
    log("ERROR", message)


# =========================
# BCM pin mapping
# =========================
DHT_GPIO_PIN = 4
TRIG_PIN = 14
ECHO_PIN = 15


# =========================
# Timing and threshold settings
# =========================
PERSON_THRESHOLD_M = 1.0
CHECK_INTERVAL_SEC = 0.5
SAMPLE_INTERVAL_SEC = 10.0
MAX_DISTANCE_M = 4.0
DHT_RETRY_COUNT = 3
DHT_RETRY_DELAY_SEC = 2.0


# =========================
# Sensor setup
# =========================
ultrasonic = DistanceSensor(
    echo=ECHO_PIN,
    trigger=TRIG_PIN,
    max_distance=MAX_DISTANCE_M,
    queue_len=3,
)

dht11 = None
dht_backend = None


def upload_sensor_data(distance_m, temperature_c, humidity, person_detected, mode):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {DEVICE_INGEST_TOKEN}",
    }

    payload = {
        "device_id": DEVICE_ID,
        "captured_at": None,
        "distance_m": distance_m,
        "temperature_c": temperature_c,
        "humidity": humidity,
        "person_detected": person_detected,
        "mode": mode,
    }

    try:
        response = requests.post(
            API_URL,
            json=payload,
            headers=headers,
            timeout=REQUEST_TIMEOUT_SEC,
        )
        response.raise_for_status()
        log_info(f"Upload success: {response.json()}")
        return True
    except requests.RequestException as exc:
        log_error(f"Upload failed: {exc}")
        return False


def read_distance_m():
    """Return the measured distance in meters."""
    return ultrasonic.distance


def setup_dht11():
    """Initialize whichever DHT library is available on the Raspberry Pi."""
    global dht11, dht_backend

    if adafruit_dht is not None and board is not None:
        dht11 = adafruit_dht.DHT11(board.D4, use_pulseio=False)
        dht_backend = "adafruit_circuitpython"
        return True

    if Adafruit_DHT is not None:
        dht11 = Adafruit_DHT.DHT11
        dht_backend = "adafruit_legacy"
        return True

    return False


def read_dht11():
    """Read temperature and humidity with retry logic."""
    if dht_backend == "adafruit_circuitpython":
        for _ in range(DHT_RETRY_COUNT):
            try:
                temperature = dht11.temperature
                humidity = dht11.humidity

                if temperature is not None and humidity is not None:
                    return temperature, humidity
            except RuntimeError:
                pass

            time.sleep(DHT_RETRY_DELAY_SEC)

    elif dht_backend == "adafruit_legacy":
        humidity, temperature = Adafruit_DHT.read_retry(
            dht11,
            DHT_GPIO_PIN,
            retries=DHT_RETRY_COUNT,
            delay_seconds=DHT_RETRY_DELAY_SEC,
        )
        if temperature is not None and humidity is not None:
            return temperature, humidity

    return None, None


def main():
    if not setup_dht11():
        log_error("DHT11 library not found.")
        log_info("Install one of these in Thonny Shell, then run again:")
        log_info("1. pip3 install adafruit-circuitpython-dht")
        log_info("2. pip3 install Adafruit_DHT")
        return

    log_info("System booted. Entering monitoring mode.")
    current_mode = "standby"

    while True:
        distance = read_distance_m()

        if distance < PERSON_THRESHOLD_M:
            if current_mode != "collecting":
                log_info(
                    f"Person detected at {distance:.2f} m. Entering data collection mode."
                )
                current_mode = "collecting"

            temperature, humidity = read_dht11()

            if temperature is None or humidity is None:
                log_warn(
                    f"Distance: {distance:.2f} m | DHT11 read failed, will retry next cycle."
                )
            else:
                log_info(
                    f"Distance: {distance:.2f} m | "
                    f"Temperature: {temperature:.1f} C | "
                    f"Humidity: {humidity:.1f} %"
                )
                upload_sensor_data(
                    distance_m=distance,
                    temperature_c=temperature,
                    humidity=humidity,
                    person_detected=True,
                    mode="collecting",
                )

            log_info(f"Waiting {SAMPLE_INTERVAL_SEC:.0f} seconds before next sample.")
            time.sleep(SAMPLE_INTERVAL_SEC)

        else:
            if current_mode != "standby":
                log_info(
                    f"Distance is now {distance:.2f} m. No person nearby, entering standby mode."
                )
                current_mode = "standby"
                upload_sensor_data(
                    distance_m=distance,
                    temperature_c=None,
                    humidity=None,
                    person_detected=False,
                    mode="standby",
                )

            time.sleep(CHECK_INTERVAL_SEC)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log_info("Program stopped by user.")
    finally:
        ultrasonic.close()
        if dht_backend == "adafruit_circuitpython" and dht11 is not None:
            dht11.exit()