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

function statusBadgeClass(isOnline: boolean) {
  return isOnline
    ? 'border-emerald-400/30 bg-emerald-400/15 text-emerald-200'
    : 'border-rose-400/30 bg-rose-400/15 text-rose-200'
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

        <div className="rounded-2xl border border-white/10 bg-neutral-950/75 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
          <p className="text-sm text-neutral-400">在線狀態</p>
          <div className="mt-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold uppercase tracking-wide ${statusBadgeClass(isDeviceOnline)}`}
            >
              {isDeviceOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950/75 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
          <p className="text-sm text-neutral-400">最後更新</p>
          <p className="mt-2 text-lg font-semibold">
            {new Date(device.last_seen).toLocaleString('zh-TW')}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950/75 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
          <p className="text-sm text-neutral-400">距離</p>
          <p className="mt-2 text-3xl font-semibold">
            {device.last_distance_m ?? '--'} m
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950/75 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
          <p className="text-sm text-neutral-400">溫度</p>
          <p className="mt-2 text-3xl font-semibold">
            {device.last_temperature_c ?? '--'} °C
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950/75 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
          <p className="text-sm text-neutral-400">濕度</p>
          <p className="mt-2 text-3xl font-semibold">
            {device.last_humidity ?? '--'} %
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
                    <td className="px-3 py-4">{log.distance_m ?? '--'} m</td>
                    <td className="px-3 py-4">{log.temperature_c ?? '--'} °C</td>
                    <td className="px-3 py-4">{log.humidity ?? '--'} %</td>
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
