"use client"

import { Boxes, FileCode2, FileStack, FolderArchive, ShieldAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import type {
  ArtifactRecord,
  AssetRecord,
  FindingRecord,
  ReducedToolEvidence,
  RunRecord,
  StableRunReport,
} from "@/lib/patriot-api"

export type ReportViewTab = "summary" | "findings" | "assets" | "evidence" | "artifacts"

export const reportTabs: Array<{ id: ReportViewTab; label: string; icon: typeof FileStack }> = [
  { id: "summary", label: "Summary", icon: FileStack },
  { id: "findings", label: "Findings", icon: ShieldAlert },
  { id: "assets", label: "Assets", icon: Boxes },
  { id: "evidence", label: "Evidence", icon: FileCode2 },
  { id: "artifacts", label: "Artifacts", icon: FolderArchive },
]

export function formatDateTime(value?: string) {
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

function statusTone(status: ReducedToolEvidence["status"]) {
  switch (status) {
    case "success":
      return "text-[#9fe8b0]"
    case "error":
    case "failed":
      return "text-[#ffadb3]"
    default:
      return "text-white/45"
  }
}

export function SummaryPanel({ run, report }: { run: RunRecord; report: StableRunReport }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Run" value={run.status} detail={run.id} />
        <MetricCard label="Findings" value={String(report.findings.length).padStart(2, "0")} />
        <MetricCard label="Assets" value={String(report.assets.length).padStart(2, "0")} />
      </div>

      <div className="border border-white/10 bg-[#101010] p-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
          <FileStack size={14} />
          Narrative
        </div>
        <div className="whitespace-pre-wrap text-[13px] leading-7 text-white/82">{report.narrative.summary}</div>
      </div>
    </div>
  )
}

export function FindingsPanel({ findings }: { findings: FindingRecord[] }) {
  if (findings.length === 0) {
    return <EmptyPanel copy="No structured findings were recorded for this run." />
  }

  return (
    <div className="space-y-3">
      {findings.map((finding) => (
        <article key={finding.id} className="border border-white/10 bg-[#101010] p-4">
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
          {finding.evidence.length > 0 ? (
            <div className="mt-4 border border-white/10 bg-[#0d0d0d] p-3">
              <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/35">Evidence</div>
              <ul className="space-y-2 text-[12px] leading-6 text-white/66">
                {finding.evidence.slice(0, 4).map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {finding.remediation ? (
            <div className="mt-4 border border-white/10 bg-[#0d0d0d] p-3">
              <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/35">Remediation</div>
              <div className="text-[12px] leading-6 text-white/66">{finding.remediation}</div>
            </div>
          ) : null}
          {finding.source_tools.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {finding.source_tools.map((tool) => (
                <span key={tool} className="border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
                  {tool}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}

export function AssetsPanel({ assets }: { assets: AssetRecord[] }) {
  if (assets.length === 0) {
    return <EmptyPanel copy="No assets were recorded for this run." />
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {assets.map((asset) => (
        <article key={asset.id} className="border border-white/10 bg-[#101010] p-4">
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

export function EvidencePanel({ evidence }: { evidence: ReducedToolEvidence[] }) {
  if (evidence.length === 0) {
    return <EmptyPanel copy="No reduced tool evidence was recorded for this run." />
  }

  return (
    <div className="space-y-3">
      {evidence.map((entry) => (
        <article key={`${entry.tool}-${entry.target ?? "none"}`} className="border border-white/10 bg-[#101010] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm uppercase tracking-[0.12em] text-white/88">{entry.tool}</div>
            <div className={cn("text-[10px] uppercase tracking-[0.18em]", statusTone(entry.status))}>{entry.status}</div>
          </div>
          {entry.target ? <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/35">{entry.target}</div> : null}
          {entry.coverage ? <div className="mt-3 text-[12px] leading-6 text-white/58">{entry.coverage}</div> : null}
          <ul className="mt-4 space-y-2 text-[12px] leading-6 text-white/68">
            {entry.key_facts.length > 0 ? entry.key_facts.map((fact) => <li key={fact}>- {fact}</li>) : <li>- No compact facts recorded.</li>}
          </ul>
          {entry.evidence_gaps.length > 0 ? (
            <div className="mt-4 border border-[#421419] bg-[#140c0e] p-3">
              <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#ffadb3]">Evidence Gaps</div>
              <ul className="space-y-2 text-[12px] leading-6 text-[#f1c2c6]">
                {entry.evidence_gaps.slice(0, 4).map((gap) => (
                  <li key={gap}>- {gap}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}

export function ArtifactsPanel({ artifacts }: { artifacts: ArtifactRecord[] }) {
  if (artifacts.length === 0) {
    return <EmptyPanel copy="No run artifacts were recorded for this report." />
  }

  return (
    <div className="space-y-3">
      {artifacts.map((artifact) => (
        <article key={artifact.id} className="border border-white/10 bg-[#101010] p-4">
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

export function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="border border-white/10 bg-[#101010] p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</div>
      <div className="mt-3 text-sm uppercase tracking-[0.12em] text-white/88">{value}</div>
      {detail ? <div className="mt-3 break-all text-[12px] leading-6 text-white/58">{detail}</div> : null}
    </div>
  )
}

export function EmptyPanel({ copy }: { copy: string }) {
  return (
    <div className="border border-dashed border-white/10 bg-[#101010] p-5 text-[12px] leading-6 text-white/55">
      {copy}
    </div>
  )
}
