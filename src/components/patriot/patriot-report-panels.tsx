"use client"

import { AlertTriangle, Boxes, CheckCircle2, FileCode2, FileStack, FolderArchive, ShieldAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import type {
  ArtifactRecord,
  AssetRecord,
  FindingRecord,
  ReducedToolEvidence,
  ReconCoverage,
  ReconDeliverableItem,
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

function assessmentTone(status: StableRunReport["assessment"]["status"]) {
  switch (status) {
    case "fulfilled":
      return "border-[#17341f] bg-[#101b14] text-[#9fe8b0]"
    case "invalid":
      return "border-[#5a171d] bg-[#190d11] text-[#ffadb3]"
    default:
      return "border-[#4f4617] bg-[#17140d] text-[#f3dc7a]"
  }
}

function coverageLabel(key: keyof ReconCoverage) {
  return key.replace(/_/g, " ")
}

function DeliverableSection({ label, items }: { label: string; items: ReconDeliverableItem[] }) {
  if (items.length === 0) return null

  return (
    <div className="border border-white/10 bg-[#0d0d0d] p-3">
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</div>
      <div className="space-y-2 text-[12px] leading-6 text-white/68">
        {items.slice(0, 8).map((item) => (
          <div key={`${label}-${item.value}`} className="flex items-start justify-between gap-3">
            <span className="min-w-0 break-all">{item.value}</span>
            <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-white/38">{item.confidence}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SummaryPanel({ run, report }: { run: RunRecord; report: StableRunReport }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Run" value={run.status} detail={run.id} />
        <MetricCard label="Assessment" value={report.assessment.status} />
        <MetricCard label="Findings" value={String(report.findings.length).padStart(2, "0")} />
        <MetricCard label="Assets" value={String(report.assets.length).padStart(2, "0")} />
      </div>

      <div className={cn("border p-4", assessmentTone(report.assessment.status))}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]">
            {report.assessment.status === "fulfilled" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            Assessment status
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em]">
            {report.assessment.request_fulfilled ? "fulfilled" : "unfulfilled"}
          </div>
        </div>
        <div className="mt-3 text-[12px] leading-6">{report.assessment.coverage_summary}</div>
        {report.assessment.gate_failures.length > 0 ? (
          <div className="mt-3 text-[11px] leading-5">
            Gate failures: {report.assessment.gate_failures.join(", ")}
          </div>
        ) : null}
      </div>

      <div className="border border-white/10 bg-[#101010] p-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
          <CheckCircle2 size={14} />
          Minimum Coverage
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {Object.entries(report.assessment.minimum_coverage).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between border border-white/10 px-3 py-2 text-[12px] text-white/72">
              <span className="uppercase tracking-[0.16em] text-white/45">{coverageLabel(key as keyof ReconCoverage)}</span>
              <span className={value ? "text-[#9fe8b0]" : "text-[#ffadb3]"}>{value ? "yes" : "no"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-white/10 bg-[#101010] p-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
          <FileStack size={14} />
          Narrative
        </div>
        <div className="whitespace-pre-wrap text-[13px] leading-7 text-white/82">{report.narrative.summary}</div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <DeliverableSection label="Domains" items={report.recon_deliverables.domains} />
        <DeliverableSection label="Subdomains" items={report.recon_deliverables.subdomains} />
        <DeliverableSection label="Entry points" items={report.recon_deliverables.entry_points} />
        <DeliverableSection label="Login surfaces" items={report.recon_deliverables.login_surfaces} />
        <DeliverableSection label="Admin surfaces" items={report.recon_deliverables.admin_surfaces} />
        <DeliverableSection label="API endpoints" items={report.recon_deliverables.api_endpoints} />
        <DeliverableSection label="JavaScript routes" items={report.recon_deliverables.javascript_routes} />
        <DeliverableSection label="Integrations" items={report.recon_deliverables.third_party_integrations} />
        <DeliverableSection label="Storage exposure" items={report.recon_deliverables.storage_exposures} />
        <DeliverableSection label="Trust boundaries" items={report.recon_deliverables.trust_boundaries} />
      </div>

      <DeliverableSection label="Next actions" items={report.recon_deliverables.next_actions} />

      {report.assignments.length > 0 ? (
        <div className="border border-white/10 bg-[#101010] p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
            <FileStack size={14} />
            Execution phases
          </div>
          <div className="space-y-3">
            {report.assignments.map((assignment) => (
              <article key={assignment.id} className="border border-white/10 bg-[#0d0d0d] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[12px] uppercase tracking-[0.16em] text-white/82">
                    {assignment.kind} / {assignment.capability_family}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">{assignment.status}</div>
                </div>
                <div className="mt-2 text-[11px] leading-5 text-white/58">
                  {assignment.worker_id}
                  {assignment.adapter_kind ? ` / ${assignment.adapter_kind}` : ""}
                </div>
                {assignment.notes.length > 0 ? (
                  <div className="mt-3 space-y-1 text-[12px] leading-6 text-white/68">
                    {assignment.notes.map((note) => (
                      <div key={`${assignment.id}-${note}`}>- {note}</div>
                    ))}
                  </div>
                ) : null}
                {assignment.target_scope.length > 0 ? (
                  <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/38">
                    Targets: {assignment.target_scope.join(", ")}
                  </div>
                ) : null}
                {assignment.error ? (
                  <div className="mt-3 text-[12px] leading-6 text-[#ffadb3]">Reason: {assignment.error}</div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
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
