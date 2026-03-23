"use client"

import Link from "next/link"
import { startTransition, useEffect, useEffectEvent, useState } from "react"
import { ArrowLeft, LoaderCircle } from "lucide-react"

import { PatriotHeader } from "@/components/patriot/patriot-header"
import {
  ArtifactsPanel,
  AssetsPanel,
  EmptyPanel,
  EvidencePanel,
  FindingsPanel,
  SummaryPanel,
  formatDateTime,
  reportTabs,
  type ReportViewTab,
} from "@/components/patriot/patriot-report-panels"
import { patriotApi, type ArtifactRecord, type RunRecord, type StableRunReport } from "@/lib/patriot-api"
import { cn } from "@/lib/utils"

export function PatriotReportDetailPage({ runId }: { runId: string }) {
  const [run, setRun] = useState<RunRecord | null>(null)
  const [report, setReport] = useState<StableRunReport | null>(null)
  const [artifacts, setArtifacts] = useState<ArtifactRecord[]>([])
  const [activeTab, setActiveTab] = useState<ReportViewTab>("summary")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshReport = useEffectEvent(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const [runsResponse, reportResponse, artifactsResponse] = await Promise.all([
        patriotApi.listRuns(),
        patriotApi.getRunReport(id),
        patriotApi.getRunArtifacts(id),
      ])
      startTransition(() => {
        setRun(runsResponse.runs.find((entry) => entry.id === id) ?? null)
        setReport(reportResponse)
        setArtifacts(artifactsResponse.artifacts)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  })

  useEffect(() => {
    if (!runId) return
    void refreshReport(runId)
  }, [runId])

  return (
    <div className="relative h-dvh overflow-hidden bg-[#101010] text-white industrial-grid">
      <PatriotHeader active="reports" />
      <main className="h-[calc(100dvh-52px)] overflow-y-auto font-mono">
        <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col px-6 py-6">
          <div className="border border-white/10 bg-[#101010] px-5 py-5">
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45 transition-colors hover:text-white"
            >
              <ArrowLeft size={14} />
              Back to reports
            </Link>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Report detail</div>
                <div className="mt-2 break-all text-sm uppercase tracking-[0.18em] text-white/88">{runId}</div>
                {run ? (
                  <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-white/38">
                    {run.status} / updated {formatDateTime(run.updatedAt)}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {reportTabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em]",
                        activeTab === tab.id
                          ? "border-[#ec3844] bg-[#190d11] text-white"
                          : "border-white/10 bg-[#101010] text-white/55 hover:text-white",
                      )}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
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
              Loading report
            </div>
          ) : report && run ? (
            <div className="mt-4">
              {activeTab === "summary" ? <SummaryPanel run={run} report={report} /> : null}
              {activeTab === "findings" ? <FindingsPanel findings={report.findings} /> : null}
              {activeTab === "assets" ? <AssetsPanel assets={report.assets} /> : null}
              {activeTab === "evidence" ? <EvidencePanel evidence={report.tool_evidence} /> : null}
              {activeTab === "artifacts" ? <ArtifactsPanel artifacts={artifacts} /> : null}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyPanel copy="This report could not be loaded." />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
