"use client"

import { startTransition, useDeferredValue, useEffect, useEffectEvent, useState } from "react"
import { Boxes, FileCode2, FileStack, FolderArchive, LoaderCircle, ShieldAlert } from "lucide-react"

import { PatriotHeader } from "@/components/patriot/patriot-header"
import { cn } from "@/lib/utils"
import {
  patriotApi,
  type ArtifactRecord,
  type AssetRecord,
  type FindingRecord,
  type ReducedToolEvidence,
  type RunRecord,
  type StableRunReport,
} from "@/lib/patriot-api"

type ViewTab = "summary" | "findings" | "assets" | "evidence" | "artifacts"

const tabs: Array<{ id: ViewTab; label: string; icon: typeof FileStack }> = [
  { id: "summary", label: "Summary", icon: FileStack },
  { id: "findings", label: "Findings", icon: ShieldAlert },
  { id: "assets", label: "Assets", icon: Boxes },
  { id: "evidence", label: "Evidence", icon: FileCode2 },
  { id: "artifacts", label: "Artifacts", icon: FolderArchive },
]

function formatDateTime(value?: string) {
  if (!value) return "Unknown"
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function severityTone(severity: FindingRecord["severity"]) {
  switch (severity) {
    case "critical":
      return "bg-[#ec3844] text-white"
    case "high":
      return "bg-[#421419] text-[#ffadb3]"
    case "medium":
      return "bg-[#23262d] text-white/78"
    case "low":
      return "bg-[#171a1f] text-white/65"
    default:
      return "bg-[#101317] text-white/55"
  }
}

export function PatriotReportsPage() {
  const [runs, setRuns] = useState<RunRecord[]>([])
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const deferredRunId = useDeferredValue(selectedRunId)
  const [report, setReport] = useState<StableRunReport | null>(null)
  const [artifacts, setArtifacts] = useState<ArtifactRecord[]>([])
  const [activeTab, setActiveTab] = useState<ViewTab>("summary")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshRuns = useEffectEvent(async () => {
    const response = await patriotApi.listRuns()
    const reportableRuns = response.runs.filter((run) => run.reportPath || run.status === "completed")
    startTransition(() => {
      setRuns(reportableRuns)
      setSelectedRunId((current) => current ?? reportableRuns[0]?.id ?? null)
    })
  })

  const refreshReport = useEffectEvent(async (runId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const [reportResponse, artifactsResponse] = await Promise.all([
        patriotApi.getRunReport(runId),
        patriotApi.getRunArtifacts(runId),
      ])
      startTransition(() => {
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
    void refreshRuns()
  }, [])

  useEffect(() => {
    if (!deferredRunId) return
    void refreshReport(deferredRunId)
  }, [deferredRunId])

  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? null

  return (
    <div className="relative h-dvh overflow-hidden bg-[#07090c] text-white industrial-grid">
      <PatriotHeader active="reports" />
      <main className="grid h-[calc(100dvh-52px)] grid-cols-[minmax(320px,1fr)_minmax(0,2fr)] overflow-hidden font-mono">
        <section className="flex min-h-0 min-w-0 flex-col border-r border-white/10 bg-[#090c10]">
          <div className="border-b border-white/10 px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Report index</div>
            <div className="mt-2 text-sm uppercase tracking-[0.18em] text-white/88">
              {runs.length.toString().padStart(2, "0")} completed runs
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto px-3 py-3">
            <div className="space-y-2">
              {runs.length === 0 ? (
                <div className="border border-dashed border-white/10 bg-[#0d1116] px-4 py-4 text-[12px] leading-6 text-white/55">
                  No completed reports available yet.
                </div>
              ) : (
                runs.map((run) => {
                  const isActive = run.id === selectedRunId
                  return (
                    <button
                      key={run.id}
                      type="button"
                      onClick={() => setSelectedRunId(run.id)}
                      className={cn(
                        "w-full border px-3 py-3 text-left transition-colors",
                        isActive
                          ? "border-[#ec3844] bg-[#170d11]"
                          : "border-white/10 bg-[#0d1116] hover:border-white/20",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-white/38">
                        <span>{run.status}</span>
                        <span>{formatDateTime(run.updatedAt)}</span>
                      </div>
                      <div className="mt-2 break-all text-[12px] leading-6 text-white/88">{run.id}</div>
                      {run.summary ? (
                        <div className="mt-3 line-clamp-3 text-[12px] leading-6 text-white/58">{run.summary}</div>
                      ) : null}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </section>

        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#0b0f14]">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Report workspace</div>
                <div className="mt-2 text-sm uppercase tracking-[0.18em] text-white/88">
                  {selectedRun ? `Run ${selectedRun.id.slice(0, 8)}` : "Awaiting report"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
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
                          : "border-white/10 bg-[#0f1318] text-white/55 hover:text-white",
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

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {error ? (
              <div className="mb-4 border border-[#ec3844]/50 bg-[#1a0d11] px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-[#ffb3b8]">
                {error}
              </div>
            ) : null}

            {isLoading && !report ? (
              <div className="flex h-full items-center justify-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45">
                <LoaderCircle className="animate-spin" size={16} />
                Loading report
              </div>
            ) : report && selectedRun ? (
              <>
                {activeTab === "summary" ? <SummaryPanel run={selectedRun} report={report} /> : null}
                {activeTab === "findings" ? <FindingsPanel findings={report.findings} /> : null}
                {activeTab === "assets" ? <AssetsPanel assets={report.assets} /> : null}
                {activeTab === "evidence" ? <EvidencePanel evidence={report.tool_evidence} /> : null}
                {activeTab === "artifacts" ? <ArtifactsPanel artifacts={artifacts} /> : null}
              </>
            ) : (
              <EmptyPanel copy="Select a completed run to inspect its stored report, findings, assets, and evidence." />
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function SummaryPanel({ run, report }: { run: RunRecord; report: StableRunReport }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Run" value={run.status} detail={run.id} />
        <MetricCard label="Findings" value={String(report.findings.length).padStart(2, "0")} />
        <MetricCard label="Assets" value={String(report.assets.length).padStart(2, "0")} />
      </div>

      <div className="border border-white/10 bg-[#0d1116] p-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
          <FileStack size={14} />
          Narrative
        </div>
        <div className="whitespace-pre-wrap text-[13px] leading-7 text-white/82">{report.narrative.summary}</div>
      </div>
    </div>
  )
}

function FindingsPanel({ findings }: { findings: FindingRecord[] }) {
  if (findings.length === 0) {
    return <EmptyPanel copy="No structured findings were recorded for this run." />
  }

  return (
    <div className="space-y-3">
      {findings.map((finding) => (
        <article key={finding.id} className="border border-white/10 bg-[#0d1116] p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className={cn("px-2 py-1 text-[10px] uppercase tracking-[0.18em]", severityTone(finding.severity))}>
              {finding.severity}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">{finding.confidence}</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">{finding.disclosure.state}</span>
          </div>
          <div className="text-sm uppercase tracking-[0.12em] text-white/88">{finding.title}</div>
          <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/35">{finding.category}</div>
          {finding.description ? <p className="mt-4 text-[13px] leading-6 text-white/72">{finding.description}</p> : null}
        </article>
      ))}
    </div>
  )
}

function AssetsPanel({ assets }: { assets: AssetRecord[] }) {
  if (assets.length === 0) {
    return <EmptyPanel copy="No assets were recorded for this run." />
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {assets.map((asset) => (
        <article key={asset.id} className="border border-white/10 bg-[#0d1116] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm uppercase tracking-[0.12em] text-white/88">{asset.label}</div>
              <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/35">{asset.type}</div>
            </div>
            {asset.port !== undefined ? (
              <div className="border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/55">
                {asset.port}/{asset.protocol ?? "tcp"}
              </div>
            ) : null}
          </div>
          <div className="mt-4 space-y-2 text-[12px] leading-6 text-white/65">
            <div>Host: {asset.host ?? asset.ip ?? asset.url ?? "--"}</div>
            <div>Service: {asset.service ?? "--"}</div>
            <div>Version: {asset.version ?? "--"}</div>
            <div>Seen: {formatDateTime(asset.last_seen_at)}</div>
          </div>
        </article>
      ))}
    </div>
  )
}

function EvidencePanel({ evidence }: { evidence: ReducedToolEvidence[] }) {
  if (evidence.length === 0) {
    return <EmptyPanel copy="No reduced tool evidence was recorded for this run." />
  }

  return (
    <div className="space-y-3">
      {evidence.map((entry) => (
        <article key={`${entry.tool}-${entry.target ?? "none"}`} className="border border-white/10 bg-[#0d1116] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm uppercase tracking-[0.12em] text-white/88">{entry.tool}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">{entry.status}</div>
          </div>
          {entry.target ? <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/35">{entry.target}</div> : null}
          <ul className="mt-4 space-y-2 text-[12px] leading-6 text-white/68">
            {entry.key_facts.length > 0 ? entry.key_facts.map((fact) => <li key={fact}>- {fact}</li>) : <li>- No compact facts recorded.</li>}
          </ul>
        </article>
      ))}
    </div>
  )
}

function ArtifactsPanel({ artifacts }: { artifacts: ArtifactRecord[] }) {
  if (artifacts.length === 0) {
    return <EmptyPanel copy="No run artifacts were recorded for this report." />
  }

  return (
    <div className="space-y-3">
      {artifacts.map((artifact) => (
        <article key={artifact.id} className="border border-white/10 bg-[#0d1116] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm uppercase tracking-[0.12em] text-white/88">{artifact.kind}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">{formatDateTime(artifact.createdAt)}</div>
          </div>
          <div className="mt-4 break-all text-[12px] leading-6 text-white/65">{artifact.path}</div>
        </article>
      ))}
    </div>
  )
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="border border-white/10 bg-[#0d1116] p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</div>
      <div className="mt-3 text-sm uppercase tracking-[0.12em] text-white/88">{value}</div>
      {detail ? <div className="mt-3 break-all text-[12px] leading-6 text-white/58">{detail}</div> : null}
    </div>
  )
}

function EmptyPanel({ copy }: { copy: string }) {
  return (
    <div className="border border-dashed border-white/10 bg-[#0d1116] p-5 text-[12px] leading-6 text-white/55">
      {copy}
    </div>
  )
}
