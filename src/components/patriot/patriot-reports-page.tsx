"use client"

import Link from "next/link"
import { useEffect, useEffectEvent, useState } from "react"
import { ArrowRight, LoaderCircle } from "lucide-react"

import { PatriotHeader } from "@/components/patriot/patriot-header"
import { formatDateTime } from "@/components/patriot/patriot-report-panels"
import { patriotApi, type RunRecord } from "@/lib/patriot-api"

export function PatriotReportsPage() {
  const [runs, setRuns] = useState<RunRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshRuns = useEffectEvent(async () => {
    setError(null)
    try {
      setIsLoading(true)
      const response = await patriotApi.listRuns()
      setRuns(response.runs.filter((run) => run.reportPath || run.status === "completed"))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  })

  useEffect(() => {
    void refreshRuns()
  }, [])

  return (
    <div className="relative h-dvh overflow-hidden bg-[#101010] text-white industrial-grid">
      <PatriotHeader active="reports" />
      <main className="h-[calc(100dvh-52px)] overflow-y-auto font-mono">
        <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col px-6 py-6">
          <div className="border border-white/10 bg-[#101010] px-5 py-5">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Reports</div>
            <div className="mt-2 text-sm uppercase tracking-[0.18em] text-white/88">
              {runs.length.toString().padStart(2, "0")} completed runs
            </div>
          </div>

          {error ? (
            <div className="mt-4 border border-[#ec3844]/50 bg-[#1a0d11] px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-[#ffb3b8]">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-4 flex items-center gap-2 border border-white/10 bg-[#101010] px-4 py-4 text-[11px] uppercase tracking-[0.18em] text-white/45">
              <LoaderCircle className="animate-spin" size={15} />
              Loading reports
            </div>
          ) : runs.length === 0 ? (
            <div className="mt-4 border border-dashed border-white/10 bg-[#101010] px-4 py-4 text-[12px] leading-6 text-white/55">
              No completed reports available yet.
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {runs.map((run) => (
                <Link
                  key={run.id}
                  href={`/report/${run.id}`}
                  className="group border border-white/10 bg-[#101010] px-4 py-4 transition-colors hover:border-white/20 hover:bg-[#101010]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/38">
                        <span>{run.status}</span>
                        <span>{formatDateTime(run.updatedAt)}</span>
                      </div>
                      <div className="mt-3 break-all text-sm uppercase tracking-[0.12em] text-white/88">{run.id}</div>
                      {run.summary ? <div className="mt-4 text-[13px] leading-7 text-white/68">{run.summary}</div> : null}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45 group-hover:text-white">
                      Open report
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
