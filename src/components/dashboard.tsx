'use client'

import { useEffect, useMemo, useState } from 'react'

type DeviceStatus = {
  current_mode: string
  device_id: string
  is_online: boolean
  last_distance_m: number | null
  last_humidity: number | null
  last_person_detected: boolean
  last_seen: string
  last_temperature_c: number | null
}

type SensorLog = {
  captured_at: string
  device_id: string
  distance_m: number | null
  humidity: number | null
  id: number
  mode: string
  person_detected: boolean
  temperature_c: number | null
}

type DashboardPayload = {
  device: DeviceStatus | null
  logs: SensorLog[]
}

function formatDistance(value: number | null) {
  return value === null ? '--' : value.toFixed(2)
}

function formatTemperature(value: number | null) {
  return value === null ? '--' : value.toFixed(1)
}

function formatHumidity(value: number | null) {
  return value === null ? '--' : value.toFixed(1)
}

function formatElapsedTime(lastSeen: string) {
  const diffMs = Date.now() - new Date(lastSeen).getTime()
  const diffSec = Math.max(0, Math.floor(diffMs / 1000))

  if (diffSec < 60) {
    return `${diffSec} 秒前更新`
  }

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return `${diffMin} 分鐘前更新`
  }

  const diffHour = Math.floor(diffMin / 60)
  return `${diffHour} 小時前更新`
}

function statusBadgeClass(isOnline: boolean) {
  return isOnline
    ? 'border-emerald-400/30 bg-emerald-400/15 text-emerald-200'
    : 'border-rose-400/30 bg-rose-400/15 text-rose-200'
}

function statusCardClass(isOnline: boolean) {
  return isOnline
    ? 'border-emerald-400/15 bg-emerald-500/[0.07]'
    : 'border-rose-400/25 bg-rose-500/[0.12] shadow-[0_0_0_1px_rgba(251,113,133,0.12)]'
}

function modeBadgeClass(mode: string) {
  return mode === 'collecting'
    ? 'border-sky-400/30 bg-sky-400/15 text-sky-200'
    : 'border-neutral-500/30 bg-neutral-500/15 text-neutral-200'
}

function personBadgeClass(detected: boolean) {
  return detected
    ? 'border-amber-400/30 bg-amber-400/15 text-amber-200'
    : 'border-neutral-500/30 bg-neutral-500/15 text-neutral-200'
}

function buildSparklinePoints(values: Array<number | null>) {
  const numericValues = values.filter((value): value is number => value !== null)

  if (numericValues.length < 2) {
    return ''
  }

  const width = 260
  const height = 90
  const min = Math.min(...numericValues)
  const max = Math.max(...numericValues)
  const range = max - min || 1

  return values
    .map((value, index) => {
      if (value === null) {
        return null
      }

      const x = (index / (values.length - 1 || 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    .filter(Boolean)
    .join(' ')
}

function TrendChart({
  colorClass,
  title,
  unit,
  values,
}: {
  colorClass: string
  title: string
  unit: string
  values: Array<number | null>
}) {
  const points = buildSparklinePoints(values)
  const latestValue = [...values].find((value) => value !== null) ?? null

  return (
    <article className="rounded-3xl border border-white/10 bg-neutral-950/75 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold">
            {latestValue === null ? '--' : latestValue.toFixed(1)}
            <span className="ml-2 text-base font-medium text-neutral-400">{unit}</span>
          </p>
        </div>
        <span className={`inline-flex h-3 w-3 rounded-full ${colorClass}`} />
      </div>

      <div className="mt-5">
        <svg
          aria-label={`${title} trend`}
          className="h-24 w-full"
          viewBox="0 0 260 90"
          preserveAspectRatio="none"
        >
          <path
            d="M0 89.5 H260"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          {points ? (
            <polyline
              fill="none"
              points={points}
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              className={colorClass.replace('bg-', 'text-').replace('/80', '')}
            />
          ) : (
            <text
              x="130"
              y="48"
              textAnchor="middle"
              fill="rgba(255,255,255,0.45)"
              fontSize="12"
            >
              資料不足，尚無法繪製趨勢
            </text>
          )}
        </svg>
      </div>
    </article>
  )
}

export function Dashboard() {
  const [device, setDevice] = useState<DeviceStatus | null>(null)
  const [logs, setLogs] = useState<SensorLog[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchStatus() {
      try {
        const response = await fetch('/api/device-status', {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const payload: DashboardPayload = await response.json()

        if (!cancelled) {
          setDevice(payload.device ?? null)
          setLogs(payload.logs ?? [])
          setError(null)
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unknown error')
        }
      }
    }

    void fetchStatus()
    const intervalId = window.setInterval(() => {
      void fetchStatus()
    }, 5000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [])

  const isDeviceOnline = device
    ? Date.now() - new Date(device.last_seen).getTime() <= 30_000
    : false

  const trendLogs = useMemo(() => [...logs].reverse(), [logs])

  if (error) {
    return (
      <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
        讀取資料失敗：{error}
      </div>
    )
  }

  if (!device) {
    return (
      <div className="mt-8 rounded-2xl border border-white/10 bg-neutral-950/75 p-6 text-neutral-300">
        目前還沒有資料。你可以先去 Supabase 的 `device_status`
        手動新增一筆測試資料。
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-neutral-950/75 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
          <p className="text-sm text-neutral-400">裝置 ID</p>
          <p className="mt-2 text-2xl font-semibold">{device.device_id}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950/75 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
          <p className="text-sm text-neutral-400">目前模式</p>
          <div className="mt-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold uppercase tracking-wide ${modeBadgeClass(device.current_mode)}`}
            >
              {device.current_mode}
            </span>
          </div>
        </div>

        <div
          className={`rounded-2xl border bg-neutral-950/75 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)] ${statusCardClass(isDeviceOnline)}`}
        >
          <p className="text-sm text-neutral-300">在線狀態</p>
          <div className="mt-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold uppercase tracking-wide ${statusBadgeClass(isDeviceOnline)}`}
            >
              {isDeviceOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          {!isDeviceOnline && (
            <p className="mt-3 text-sm text-rose-200/85">
              目前超過 30 秒未收到新資料，系統已判定為離線。
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950/75 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
          <p className="text-sm text-neutral-400">最後更新</p>
          <p className="mt-2 text-lg font-semibold">
            {new Date(device.last_seen).toLocaleString('zh-TW')}
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            {formatElapsedTime(device.last_seen)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950/75 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
          <p className="text-sm text-neutral-400">距離</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatDistance(device.last_distance_m)} m
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950/75 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
          <p className="text-sm text-neutral-400">溫度</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatTemperature(device.last_temperature_c)} °C
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950/75 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
          <p className="text-sm text-neutral-400">濕度</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatHumidity(device.last_humidity)} %
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950/75 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
          <p className="text-sm text-neutral-400">是否偵測到人</p>
          <div className="mt-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold uppercase tracking-wide ${personBadgeClass(device.last_person_detected)}`}
            >
              {device.last_person_detected ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-3">
        <TrendChart
          title="距離趨勢"
          unit="m"
          values={trendLogs.map((log) => log.distance_m)}
          colorClass="bg-sky-300/80"
        />
        <TrendChart
          title="溫度趨勢"
          unit="°C"
          values={trendLogs.map((log) => log.temperature_c)}
          colorClass="bg-amber-300/80"
        />
        <TrendChart
          title="濕度趨勢"
          unit="%"
          values={trendLogs.map((log) => log.humidity)}
          colorClass="bg-emerald-300/80"
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-neutral-950/75 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">最近 10 筆紀錄</h2>
            <p className="mt-1 text-sm text-neutral-400">
              顯示最新的距離、溫度、濕度與偵測模式
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-sm text-neutral-400">
                <th className="px-3 py-2 font-medium">時間</th>
                <th className="px-3 py-2 font-medium">距離</th>
                <th className="px-3 py-2 font-medium">溫度</th>
                <th className="px-3 py-2 font-medium">濕度</th>
                <th className="px-3 py-2 font-medium">模式</th>
                <th className="px-3 py-2 font-medium">有人</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="rounded-2xl bg-neutral-950/70 px-3 py-4 text-neutral-400"
                  >
                    尚無歷史資料
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="rounded-2xl bg-neutral-950/70 text-sm text-white"
                  >
                    <td className="rounded-l-2xl px-3 py-4">
                      {new Date(log.captured_at).toLocaleString('zh-TW')}
                    </td>
                    <td className="px-3 py-4">{formatDistance(log.distance_m)} m</td>
                    <td className="px-3 py-4">{formatTemperature(log.temperature_c)} °C</td>
                    <td className="px-3 py-4">{formatHumidity(log.humidity)} %</td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${modeBadgeClass(log.mode)}`}
                      >
                        {log.mode}
                      </span>
                    </td>
                    <td className="rounded-r-2xl px-3 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${personBadgeClass(log.person_detected)}`}
                      >
                        {log.person_detected ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
