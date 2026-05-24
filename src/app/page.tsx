import { Dashboard } from '@/components/dashboard'

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.15),_transparent_30%),linear-gradient(180deg,_#0a0a0a_0%,_#050505_100%)] px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-10 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">
            IoT Monitoring Dashboard
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            樹莓派感測監控面板
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-300 md:text-base">
            整合樹莓派、HC-SR04 與 DHT11 感測資料，透過 Vercel API 與 Supabase
            即時顯示目前狀態、最近紀錄與在線資訊，方便校內外同步查看。
          </p>

          <Dashboard />
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-emerald-400/20 bg-emerald-400/8 p-5">
            <p className="text-sm font-medium text-emerald-200">系統流程</p>
            <p className="mt-3 text-sm leading-7 text-neutral-200">
              樹莓派讀取感測器後，將資料送至 Vercel API，再由 Supabase
              儲存最新狀態與歷史紀錄，最後由網站前端定時抓取並顯示。
            </p>
          </article>

          <article className="rounded-3xl border border-sky-400/20 bg-sky-400/8 p-5">
            <p className="text-sm font-medium text-sky-200">感測流程簡述</p>
            <p className="mt-3 text-sm leading-7 text-neutral-200">
              先用超音波量測距離，當距離小於 1 公尺時進入資料採集模式，再讀取
              DHT11 的溫度與濕度並上傳到雲端。
            </p>
          </article>

          <article className="rounded-3xl border border-amber-400/20 bg-amber-400/8 p-5">
            <p className="text-sm font-medium text-amber-200">
              為什麼使用 Supabase + Vercel
            </p>
            <p className="mt-3 text-sm leading-7 text-neutral-200">
              Supabase 適合管理最新狀態與歷史資料，Vercel 則方便快速部署前端與 API，
              讓網站在校外也能穩定存取。
            </p>
          </article>

          <article className="rounded-3xl border border-rose-400/20 bg-rose-400/8 p-5">
            <p className="text-sm font-medium text-rose-200">離線判斷機制</p>
            <p className="mt-3 text-sm leading-7 text-neutral-200">
              若最後更新時間超過 30 秒，系統會自動標示為 Offline，
              避免感測程式暫停時仍誤顯示為在線。
            </p>
          </article>
        </section>
      </div>
    </main>
  )
}
