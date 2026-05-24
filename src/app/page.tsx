import { Dashboard } from '@/components/dashboard'

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold tracking-tight">樹莓派感測監控面板</h1>
        <p className="mt-3 text-neutral-400">
          顯示目前裝置狀態、最後回傳時間與最新感測值
        </p>

        <Dashboard />
      </div>
    </main>
  )
}
