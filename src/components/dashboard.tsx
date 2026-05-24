'use client'

import { useEffect, useState } from 'react'

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

  if (error) {
    return (
      <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
        讀取資料失敗：{error}
      </div>
    )
  }

  if (!device) {
    return (
      <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-neutral-300">
        目前還沒有資料。你可以先去 Supabase 的 `device_status`
        手動新增一筆測試資料。
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-sm text-neutral-400">裝置 ID</p>
          <p className="mt-2 text-2xl font-semibold">{device.device_id}</p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-sm text-neutral-400">目前模式</p>
          <p className="mt-2 text-2xl font-semibold">{device.current_mode}</p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-sm text-neutral-400">在線狀態</p>
          <p className="mt-2 text-2xl font-semibold">
            {isDeviceOnline ? 'Online' : 'Offline'}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-sm text-neutral-400">最後更新</p>
          <p className="mt-2 text-lg font-semibold">
            {new Date(device.last_seen).toLocaleString('zh-TW')}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-sm text-neutral-400">距離</p>
          <p className="mt-2 text-3xl font-semibold">
            {device.last_distance_m ?? '--'} m
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-sm text-neutral-400">溫度</p>
          <p className="mt-2 text-3xl font-semibold">
            {device.last_temperature_c ?? '--'} °C
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-sm text-neutral-400">濕度</p>
          <p className="mt-2 text-3xl font-semibold">
            {device.last_humidity ?? '--'} %
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-sm text-neutral-400">是否偵測到人</p>
          <p className="mt-2 text-2xl font-semibold">
            {device.last_person_detected ? 'Yes' : 'No'}
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-5">
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
                    <td className="px-3 py-4">{log.distance_m ?? '--'} m</td>
                    <td className="px-3 py-4">{log.temperature_c ?? '--'} °C</td>
                    <td className="px-3 py-4">{log.humidity ?? '--'} %</td>
                    <td className="px-3 py-4">{log.mode}</td>
                    <td className="rounded-r-2xl px-3 py-4">
                      {log.person_detected ? 'Yes' : 'No'}
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
