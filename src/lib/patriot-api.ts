export type AssetRecord = {
  id: string
  type: string
  label: string
  host?: string
  ip?: string
  url?: string
  port?: number
  protocol?: string
  service?: string
  version?: string
  tags: string[]
  metadata: Record<string, unknown>
  last_seen_at: string
}

export type FindingRecord = {
  id: string
  title: string
  category: string
  severity: "info" | "low" | "medium" | "high" | "critical"
  confidence: "low" | "medium" | "high"
  status: "observed" | "validated" | "disclosed" | "resolved"
  asset_refs: string[]
  description?: string
  evidence: string[]
  remediation?: string
  remediation_status?: string
  reproduction?: string
  source_tools: string[]
  references: string[]
  cwe?: string
  cve?: string
  affected_versions: string[]
  tags: string[]
  disclosure: {
    state: "draft" | "ready" | "sent" | "accepted" | "resolved"
    reporter_notes?: string
    contact?: string
    embargo_until?: string
  }
  metadata: Record<string, unknown>
  verified_at?: string
  first_seen_at: string
  last_seen_at: string
}

export type ReducedToolEvidence = {
  tool: string
  status: string
  target?: string
  summary?: Record<string, unknown>
  key_facts: string[]
  source_tools: string[]
  stop_recommended: boolean
  coverage?: string
  evidence_gaps: string[]
  observed_at: string
}

export type ReducedEvidenceState = {
  assets: AssetRecord[]
  findings: FindingRecord[]
  tool_evidence: ReducedToolEvidence[]
  stop_recommendations: string[]
  summary_hints: string[]
}

export type RunRecord = {
  id: string
  prompt: string
  sessionId?: string
  source: "web" | "telegram" | "api"
  workerId: string
  workerType: "kali_cloud" | "kali_field" | "kali_customer_edge"
  status: "queued" | "running" | "completed" | "failed" | "stopped"
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
  createdBy?: string
  mode: "plan" | "execute"
  tier: "recon" | "simulate" | "execute"
  safetyEnabled: boolean
  summary?: string
  reportPath?: string
}

export type ArtifactRecord = {
  id: string
  runId: string
  kind: "log" | "report" | "output" | "asset" | "finding" | "evidence"
  path: string
  createdAt: string
}

export type SessionRecord = {
  id: string
  title: string
  status: "active" | "archived"
  createdAt: string
  updatedAt: string
  createdBy?: string
  currentRunId?: string
  summary?: string
  metadata: Record<string, unknown>
}

export type SessionMessageRecord = {
  id: string
  sessionId: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: string
  runId?: string
  eventRefs?: string[]
  reportRefs?: string[]
}

export type TimelineEvent = {
  id: string
  runId: string
  ts: string
  kind: "message" | "tool" | "subagent" | "verdict" | "artifact" | "status"
  title: string
  body: string
  status?: "running" | "complete" | "warning" | "failed"
  sourceEventType: string
  data?: Record<string, unknown>
}

export type StableRunReport = {
  schema_version: "patriot.report.v1"
  narrative: { summary: string; output: string }
  assets: AssetRecord[]
  findings: FindingRecord[]
  tool_evidence: ReducedToolEvidence[]
  stop_recommendations: string[]
}

export type StableSessionReport = {
  schema_version: "patriot.session.v1"
  narrative: { summary: string }
  assets: AssetRecord[]
  findings: FindingRecord[]
  tool_evidence: ReducedToolEvidence[]
  stop_recommendations: string[]
  summary_hints: string[]
  run_ids: string[]
}

export type SessionStateResponse = {
  session: SessionRecord
  state: ReducedEvidenceState
  report: StableSessionReport
  runs: RunRecord[]
}

const API_BASE =
  process.env.NEXT_PUBLIC_PATRIOT_API_BASE?.replace(/\/$/, "") || "http://127.0.0.1:18080"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

export const patriotApi = {
  baseUrl: API_BASE,
  listRuns: () => request<{ runs: RunRecord[] }>("/v1/runs"),
  listSessions: () => request<{ sessions: SessionRecord[] }>("/v1/sessions"),
  createSession: (body: { title?: string; createdBy?: string; metadata?: Record<string, unknown> }) =>
    request<SessionRecord>("/v1/sessions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getSession: (sessionId: string) => request<SessionRecord>(`/v1/sessions/${sessionId}`),
  getSessionMessages: (sessionId: string) =>
    request<{ messages: SessionMessageRecord[] }>(`/v1/sessions/${sessionId}/messages`),
  postSessionMessage: (
    sessionId: string,
    body: {
      content: string
      role?: "user" | "assistant" | "system"
      createRun?: boolean
      run?: Partial<Pick<RunRecord, "source" | "mode" | "tier" | "safetyEnabled" | "createdBy">> & {
        workerId?: string
      }
    },
  ) =>
    request<{ message: SessionMessageRecord; run?: RunRecord }>(`/v1/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getSessionRuns: (sessionId: string) => request<{ runs: RunRecord[] }>(`/v1/sessions/${sessionId}/runs`),
  getSessionState: (sessionId: string) => request<SessionStateResponse>(`/v1/sessions/${sessionId}/state`),
  getRunArtifacts: (runId: string) => request<{ artifacts: ArtifactRecord[] }>(`/v1/runs/${runId}/artifacts`),
  getRunReport: (runId: string) => request<StableRunReport>(`/v1/runs/${runId}/report`),
  getRunTimeline: (runId: string) => request<{ events: TimelineEvent[] }>(`/v1/runs/${runId}/timeline`),
  stopRun: (runId: string) =>
    request<RunRecord>(`/v1/runs/${runId}/stop`, {
      method: "POST",
    }),
}

export function createTimelineEventSource(runId: string) {
  return new EventSource(`${API_BASE}/v1/runs/${runId}/events?view=timeline`)
}
