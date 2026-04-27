import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/router"
import { ExternalLink, Settings } from "lucide-react"

import { patriotApi } from "@/lib/patriot-api"
import { cn } from "@/lib/utils"

type PatriotHeaderProps = {
  active?: "console" | "sessions" | "reports"
  status?: "active" | "inactive"
  statusSlot?: ReactNode
  settingsSlot?: ReactNode
}

const navItems: Array<{ id: NonNullable<PatriotHeaderProps["active"]>; label: string; href: string }> = [
  { id: "console", label: "Operator console", href: "/?newChat=1" },
  { id: "sessions", label: "Sessions", href: "/sessions" },
  { id: "reports", label: "Reports", href: "/reports" },
]

export function ActivityStatusBadge({
  status,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
  className,
}: {
  status: "active" | "inactive"
  activeLabel?: string
  inactiveLabel?: string
  className?: string
}) {
  const isActive = status === "active"

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em]",
        isActive ? "text-[#d9ffe6]" : "text-[#ffb7bd]",
        className,
      )}
    >
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        <span
          className={cn(
            "absolute h-full w-full rounded-full opacity-80",
            isActive ? "animate-ping bg-[#44d17a]/70" : "animate-ping bg-[#ec3844]/70",
          )}
        />
        <span
          className={cn(
            "relative h-2.5 w-2.5 rounded-full shadow-[0_0_14px_currentColor]",
            isActive ? "bg-[#44d17a] text-[#44d17a]" : "bg-[#ec3844] text-[#ec3844]",
          )}
        />
      </span>
      <span>{isActive ? activeLabel : inactiveLabel}</span>
    </div>
  )
}

export function PatriotHeader({ active = "console", status = "inactive", statusSlot, settingsSlot }: PatriotHeaderProps) {
  const router = useRouter()

  const warmRoute = (href: string) => {
    void router.prefetch(href)
    if (href === "/sessions") {
      void patriotApi.prefetchSessions()
    }
  }

  return (
    <header className="flex h-[52px] items-center justify-between border-b border-white/10 bg-[#101010] px-4 font-mono">
      <div className="flex min-w-0 flex-1 items-center">
        <div className="group flex items-center gap-3">
          <Image
            src="/DaedalusWhite.png"
            alt="Patriot logo"
            width={20}
            height={20}
            className="h-6 w-6 object-contain transition-transform duration-700 ease-out motion-safe:group-hover:animate-spin"
            priority
          />
          <span className="text-lg font-semibold uppercase tracking-[0.24em]">Patriot</span>
        </div>
      </div>

      <nav className="flex items-center justify-center gap-6 px-6">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onMouseEnter={() => warmRoute(item.href)}
            onFocus={() => warmRoute(item.href)}
            className={cn(
              "text-[11px] uppercase tracking-[0.24em] transition-colors",
              item.id === active ? "text-white" : "text-white/45 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        ))}
        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-[11px] uppercase tracking-[0.24em] text-white/45 hover:text-white"
        >
          Docs
          <ExternalLink size={12} />
        </a>
      </nav>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
        {statusSlot ?? <ActivityStatusBadge status={status} />}
        {settingsSlot ?? (
          <button type="button" className="text-white/45 hover:text-white">
            <Settings size={18} />
          </button>
        )}
      </div>
    </header>
  )
}
