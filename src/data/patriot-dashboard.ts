export type StreamItemKind = "user" | "agent" | "tool" | "log"
export type StreamItemStatus = "running" | "complete" | "flagged" | "queued"
export type Severity = "critical" | "high" | "medium" | "low"

export type StreamItem = {
  id: string
  kind: StreamItemKind
  title: string
  body: string
  timestamp: string
  status?: StreamItemStatus
  tags?: string[]
  command?: string
  output?: string[]
}

export type OverviewMetric = {
  label: string
  value: string
  detail: string
}

export type CoverageMetric = {
  phase: string
  value: number
}

export type Finding = {
  id: string
  title: string
  severity: Severity
  asset: string
  tactic: string
  summary: string
  impact: string
}

export type FinalizedReport = {
  id: string
  title: string
  status: "ready" | "review" | "exporting"
  scope: string
  updatedAt: string
  pages: number
}

export const initialStream: StreamItem[] = [
  {
    id: "user-brief",
    kind: "user",
    title: "Mission brief",
    body:
      "Map the attack surface for the production tenant, confirm exploitable auth paths, and prepare an executive-ready report with evidence.",
    timestamp: "09:12",
    tags: ["prod-west", "full-scope"],
  },
  {
    id: "agent-plan",
    kind: "agent",
    title: "Agent plan locked",
    body:
      "Bootstrapping recon, validating exposed endpoints, and cross-linking evidence into the case file before final report generation.",
    timestamp: "09:13",
    status: "running",
    tags: ["recon", "triage", "reporting"],
  },
  {
    id: "tool-nmap",
    kind: "tool",
    title: "Tool call",
    body: "Port fingerprint sweep completed against the external edge.",
    timestamp: "09:14",
    status: "complete",
    command: "patriot.scan surface --target prod-west --profile external-edge",
    output: [
      "443/tcp open  envoy",
      "8443/tcp open  admin-gateway",
      "9443/tcp open  debug-proxy",
    ],
  },
  {
    id: "log-auth",
    kind: "log",
    title: "Evidence linked",
    body:
      "JWT audience mismatch reproduced on the legacy operator portal. Session accepted by downstream reporting API.",
    timestamp: "09:16",
    status: "flagged",
    tags: ["auth", "pivot path"],
  },
  {
    id: "tool-crawler",
    kind: "tool",
    title: "Tool call",
    body: "Internal route enumeration is still running against the debug gateway.",
    timestamp: "09:18",
    status: "running",
    command: "patriot.crawl routes --base https://debug.prod-west/panel --depth 3",
    output: [
      "[running] /panel/internal/audit",
      "[running] /panel/support/impersonate",
      "[running] /panel/export/raw",
    ],
  },
  {
    id: "agent-report",
    kind: "agent",
    title: "Report synthesis",
    body:
      "Consolidating exploit proof, business impact, and recommended containment into the client-ready report pack.",
    timestamp: "09:20",
    status: "queued",
    tags: ["executive-pack", "remediation"],
  },
]

export const overviewMetrics: OverviewMetric[] = [
  {
    label: "Active runs",
    value: "03",
    detail: "2 exploit validations, 1 report export",
  },
  {
    label: "Confirmed findings",
    value: "07",
    detail: "3 critical, 2 high, 2 medium",
  },
  {
    label: "Report readiness",
    value: "86%",
    detail: "evidence chain complete for primary scope",
  },
]

export const coverageMetrics: CoverageMetric[] = [
  { phase: "Recon", value: 91 },
  { phase: "Initial access", value: 74 },
  { phase: "Privilege path", value: 63 },
  { phase: "Data exposure", value: 82 },
]

export const findings: Finding[] = [
  {
    id: "finding-01",
    title: "Operator portal accepts mismatched JWT audience",
    severity: "critical",
    asset: "portal.prod-west.internal",
    tactic: "Privilege escalation",
    summary:
      "A token minted for the legacy portal is accepted by a separate reporting API without audience enforcement.",
    impact: "Cross-application session replay enables unauthorized report access and downstream impersonation.",
  },
  {
    id: "finding-02",
    title: "Debug gateway exposes raw export endpoint",
    severity: "critical",
    asset: "debug.prod-west.internal",
    tactic: "Sensitive data exposure",
    summary:
      "The debug gateway serves unredacted CSV exports behind a weak operator-only path check.",
    impact: "Direct access to PII-bearing customer exports without normal audit controls.",
  },
  {
    id: "finding-03",
    title: "Support impersonation route lacks step-up challenge",
    severity: "high",
    asset: "support-console.prod-west",
    tactic: "Account takeover",
    summary:
      "Privileged impersonation can be triggered with a single active session and no additional operator verification.",
    impact: "Operator account compromise immediately converts to broad tenant access.",
  },
  {
    id: "finding-04",
    title: "Scan worker leaks internal hostnames in job output",
    severity: "medium",
    asset: "worker-prod-west-02",
    tactic: "Discovery",
    summary:
      "Verbose error output returns internal service topology to any authenticated project member.",
    impact: "Reduces attacker effort required to target internal systems and service owners.",
  },
]

export const finalizedReports: FinalizedReport[] = [
  {
    id: "report-01",
    title: "Executive incident snapshot",
    status: "ready",
    scope: "Tenant leadership brief",
    updatedAt: "5 min ago",
    pages: 12,
  },
  {
    id: "report-02",
    title: "Technical validation dossier",
    status: "review",
    scope: "Engineering remediation pack",
    updatedAt: "2 min ago",
    pages: 28,
  },
  {
    id: "report-03",
    title: "Evidence archive export",
    status: "exporting",
    scope: "Forensics package",
    updatedAt: "live",
    pages: 41,
  },
]
