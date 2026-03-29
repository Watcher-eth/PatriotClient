import type { CSSProperties, ReactNode } from "react"

import { PatriotHeader } from "@/components/patriot/patriot-header"

const noiseBackgroundStyle: CSSProperties = {
  background: "#101010",
  backgroundImage: `
    radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.06) 1px, transparent 0),
    radial-gradient(circle at 1px 1px, rgba(190, 190, 190, 0.04) 1px, transparent 0),
    radial-gradient(circle at 1px 1px, rgba(120, 120, 120, 0.1) 1px, transparent 0)
  `,
  backgroundSize: "20px 20px, 30px 30px, 25px 25px",
  backgroundPosition: "0 0, 10px 10px, 15px 5px",
}

type PatriotNoiseShellProps = {
  active: "console" | "sessions" | "reports"
  children: ReactNode
}

export function PatriotNoiseShell({ active, children }: PatriotNoiseShellProps) {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#101010] text-white">
      <div aria-hidden className="absolute inset-0 z-0" style={noiseBackgroundStyle} />
      <div className="relative z-10 flex h-full flex-col">
        <PatriotHeader active={active} />
        <main className="h-[calc(100dvh-52px)] overflow-y-auto font-mono">{children}</main>
      </div>
    </div>
  )
}
