import Image from "next/image"
import { ExternalLink, Settings } from "lucide-react"

export function PatriotHeader() {
  return (
    <header className="flex h-[52px] items-center justify-between border-b border-white/10 bg-[#0a0d11] px-4 font-mono">
      <div className="flex min-w-0 flex-1 items-center">
        <div className="flex items-center gap-2">
          <Image
            src="/DaedalusWhite.png"
            alt="Patriot logo"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
            priority
          />
          <span className="text-sm font-semibold uppercase tracking-[0.24em]">Patriot</span>
        </div>
      </div>

      <nav className="flex items-center justify-center gap-6 px-6">
        <span className="text-[11px] uppercase tracking-[0.24em] text-white/45">Operator console</span>
        <span className="text-[11px] uppercase tracking-[0.24em] text-white/45">Sessions</span>
        <span className="text-[11px] uppercase tracking-[0.24em] text-white/45">Reports</span>
        <a
          href="#"
          className="flex items-center gap-1 text-[11px] uppercase tracking-[0.24em] text-white/45 hover:text-white"
        >
          Docs
          <ExternalLink size={12} />
        </a>
      </nav>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
        <button
          type="button"
          className="rounded-sm border border-[#ec3844] bg-[#ec3844] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-[#d72b38]"
        >
          Active
        </button>
        <button type="button" className="text-white/45 hover:text-white">
          <Settings size={18} />
        </button>
      </div>
    </header>
  )
}
