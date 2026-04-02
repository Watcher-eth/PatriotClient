export type WorkerCapability =
  | "lan_access"
  | "wireless_monitor"
  | "wireless_injection"
  | "packet_capture"
  | "router_admin_access"
  | "local_subnet_recon"
  | "arp_neighbors"
  | "bonjour_mdns_scan"
  | "gateway_fingerprint"
  | "nmap_scan"
  | "local_network_context"
  | "bluetooth_scan"
  | "bluetooth_service_probe"
  | "local_service_probe"
  | "http_service_probe"
  | "tls_service_probe"
  | "network_change_monitor"
  | "wifi_environment_scan"
  | "subnet_host_probe"

export type WorkerAdapterKind = "desktop" | "mobile" | "hardware" | "cloud"
export type WorkerAdapterPlatformFamily = "desktop" | "mobile" | "hardware" | "cloud"
export type WorkerSetupMethod = "native_pairing" | "deep_link" | "installer" | "script" | "remote_managed" | "bridge"
export type WorkerAdapterHealth = "healthy" | "degraded" | "blocked"
export type WorkerCapabilityState = "detected" | "available" | "missing" | "degraded" | "requires_permission"
export type WorkerToolState = "available" | "missing" | "degraded" | "requires_permission"
export type WorkerPermissionState =
  | "granted"
  | "denied"
  | "not_determined"
  | "requires_foreground"
  | "unavailable"
export type WorkerPermissionId =
  | "local_network"
  | "bluetooth"
  | "bluetooth_scan"
  | "location"
  | "wifi_state"
  | "nearby_devices"
  | "background_execution"
export type WorkerRadioFamily = "lan" | "bluetooth" | "wifi" | "system"
export type WorkerPowerCost = "low" | "medium" | "high"
export type WorkerSetupOption = {
  kind: "desktop" | "mobile" | "hardware" | "script"
  label: string
  deepLink?: string
  installUrl?: string
  scriptUrl?: string
  command?: string
}

export type WorkerAdapterCapabilityRecord = {
  capability: WorkerCapability
  state: WorkerCapabilityState
  evidence?: string[]
  missingDependencies?: string[]
  collectionModes?: Array<"passive" | "active" | "mixed">
  requiresForeground?: boolean
  powerCost?: WorkerPowerCost
  radioFamily?: WorkerRadioFamily
}

export type WorkerToolInventoryRecord = {
  tool: string
  state: WorkerToolState
  bin?: string
  version?: string
  evidence?: string[]
  missingDependencies?: string[]
}

export type WorkerPermissionRecord = {
  permission: WorkerPermissionId
  state: WorkerPermissionState
  lastCheckedAt: string
  details?: string[]
}

export type WorkerAdapterRecord = {
  id: string
  kind: WorkerAdapterKind
  version?: string
  platformFamily: WorkerAdapterPlatformFamily
  setupMethods: WorkerSetupMethod[]
  health: WorkerAdapterHealth
  approvalMode: "operator_approval" | "policy_auto" | "per_adapter"
  supportedEvidenceFamilies?: string[]
  diagnostics?: string[]
  recommendedFixes?: string[]
}

export type NativeClientKind = "desktop" | "mobile"
export type OperatorClientOs = "macos" | "windows" | "linux" | "ios" | "android" | "unknown"

export type NativeClientLinkInfo = {
  kind: NativeClientKind
  deepLink: string
  installUrl?: string
}

export const DESKTOP_ONLY_FIELD_SENSOR_CAPABILITIES: WorkerCapability[] = ["local_subnet_recon", "arp_neighbors", "nmap_scan"]
export const DESKTOP_FIELD_SENSOR_CAPABILITIES: WorkerCapability[] = [
  "lan_access",
  "local_subnet_recon",
  "arp_neighbors",
  "bonjour_mdns_scan",
  "gateway_fingerprint",
  "nmap_scan",
]
export const MOBILE_FIELD_SENSOR_CAPABILITIES: WorkerCapability[] = [
  "lan_access",
  "local_network_context",
  "bonjour_mdns_scan",
  "gateway_fingerprint",
  "bluetooth_scan",
  "bluetooth_service_probe",
  "local_service_probe",
  "http_service_probe",
  "tls_service_probe",
  "network_change_monitor",
]

export function hasRequiredCapabilities(
  worker: {
    capabilities: string[] | WorkerCapability[]
    capabilityInventory?: Array<{ capability: string; state: WorkerCapabilityState }>
  },
  requiredCapabilities: string[] | WorkerCapability[],
) {
  if (requiredCapabilities.length === 0) return true
  const availableCapabilities =
    worker.capabilityInventory?.length
      ? worker.capabilityInventory
          .filter((item) => item.state === "available" || item.state === "detected")
          .map((item) => item.capability)
      : worker.capabilities
  const set = new Map(availableCapabilities.map((item) => [String(item), true]))
  return requiredCapabilities.every((capability) => set.has(String(capability)))
}

export function parseRequiredCapabilities(value: unknown): WorkerCapability[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is WorkerCapability => typeof item === "string" && item.length > 0)
}

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
  source_worker_id?: string
  adapter_id?: string
  platform_family?: string
  collection_mode?: string
  coverage_gap_reason?: string
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
  workerType: "kali_cloud" | "kali_field" | "kali_customer_edge" | "field_sensor"
  model?: string
  profile?: "recon" | "redteam"
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
  requiredCapabilities?: WorkerCapability[]
  constraints?: {
    requiresKali: boolean
    requiresLocalPresence: boolean
    requiresWirelessMonitor: boolean
    requiresWirelessInjection: boolean
  }
  targetScope?: string[]
}

export type ArtifactRecord = {
  id: string
  runId: string
  kind: "log" | "report" | "output" | "asset" | "finding" | "evidence"
  path: string
  createdAt: string
}

export type WorkerRecord = {
  id: string
  name: string
  type: "kali_cloud" | "kali_field" | "kali_customer_edge" | "field_sensor"
  platform: "kali" | "macos" | "windows" | "linux" | "ios" | "android" | "embedded"
  runtime: Record<string, unknown>
  capabilities: WorkerCapability[]
  adapter?: WorkerAdapterRecord
  capabilityInventory?: WorkerAdapterCapabilityRecord[]
  toolInventory?: WorkerToolInventoryRecord[]
  permissionInventory?: WorkerPermissionRecord[]
  tailscaleIp?: string
  labels?: string[]
  artifactRoot?: string
  status: "online" | "offline" | "busy"
  claimedBy?: string
  lastHeartbeatAt: string
  createdAt: string
  updatedAt: string
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
  assignments: Array<{
    id: string
    worker_id: string
    worker_type: string
    adapter_kind?: string
    kind: string
    capability_family: string
    status: string
    target_scope: string[]
    notes: string[]
    error?: string
  }>
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

export type RunAssignmentRecord = {
  id: string
  runId: string
  workerId: string
  workerType: "kali_cloud" | "kali_field" | "kali_customer_edge" | "field_sensor"
  adapterId?: string
  adapterKind?: WorkerAdapterKind
  kind: "discovery" | "enrichment" | "validation" | "followup"
  capabilityFamily: string
  status: "planned" | "queued" | "running" | "completed" | "failed" | "skipped"
  targetScope: string[]
  notes?: string[]
  outputs?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
  error?: string
}

export type FieldSensorBootstrapInfo = {
  token: string
  os: "macos" | "windows"
  command: string
  expiresAt: string
  scriptUrl: string
  minimumVersion?: string
  recommendedClient: NativeClientKind
  requiredCapabilities: WorkerCapability[]
  desktop: NativeClientLinkInfo
  mobile: NativeClientLinkInfo
  setup: WorkerSetupOption[]
}

export type FieldSensorBootstrapStatus = "pending" | "enrolled" | "expired"

export type FieldSensorBootstrapStatusRecord = {
  token: string
  status: FieldSensorBootstrapStatus
  createdAt: string
  expiresAt: string
  usedAt?: string
  workerId?: string
  workerName?: string
  workerVersion?: string
}

export type MobileProbeKind =
  | "collect_network_context"
  | "browse_mdns_services"
  | "probe_gateway_identity"
  | "scan_ble_devices"
  | "probe_ble_services"
  | "tcp_connect_probe"
  | "http_probe"
  | "tls_probe"
  | "android_wifi_scan"
  | "android_subnet_sweep"

export type FieldSensorCommandJobRequest = {
  kind: "command"
  workerId: string
  bin: string
  args: string[]
  timeoutMs?: number
  cwd?: string
  env?: Record<string, string>
  runId?: string
}

export type FieldSensorProbeJobRequest = {
  kind: "probe"
  workerId: string
  probe: MobileProbeKind
  params?: Record<string, unknown>
  timeoutMs?: number
  runId?: string
}

export type FieldSensorJobRequest = FieldSensorCommandJobRequest | FieldSensorProbeJobRequest

export type FieldSensorCommandResult = {
  kind: "command"
  ok: boolean
  bin: string
  args: string[]
  exitCode: number | null
  stdout: string
  stderr: string
  startedAt: number
  endedAt: number
  timedOut: boolean
}

export type FieldSensorProbeResult = {
  kind: "probe"
  ok: boolean
  probe: MobileProbeKind
  observedAt: string
  target?: string
  summary?: Record<string, unknown>
  data?: Record<string, unknown>
  confidence?: "low" | "medium" | "high"
  collectionMode?: "passive" | "active" | "mixed"
  degradedReasons?: string[]
  artifacts?: Array<{
    kind: "report" | "output" | "asset" | "finding" | "evidence"
    label: string
    payload: Record<string, unknown>
  }>
  execution?: {
    startedAt: number
    endedAt: number
    timedOut: boolean
  }
}

export type FieldSensorJobResult = FieldSensorCommandResult | FieldSensorProbeResult

export type FieldSensorJobRecord = {
  id: string
  workerId: string
  kind: FieldSensorJobRequest["kind"]
  status: "pending" | "running" | "completed" | "failed"
  timeoutMs: number
  bin?: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  probe?: MobileProbeKind
  params?: Record<string, unknown>
  runId?: string
  createdAt: string
  updatedAt: string
  claimedAt?: string
  completedAt?: string
  error?: string
  result?: FieldSensorJobResult
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "")
}

export function resolvePatriotApiBase(explicitBase?: string) {
  if (explicitBase) return trimTrailingSlash(explicitBase)

  const envCandidates = [
    process.env.NEXT_PUBLIC_PATRIOT_API_BASE,
    process.env.EXPO_PUBLIC_PATRIOT_API_BASE,
    process.env.PATRIOT_API_BASE,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)

  if (envCandidates[0]) return trimTrailingSlash(envCandidates[0])

  if (typeof window !== "undefined" && window.location.origin) {
    return trimTrailingSlash(window.location.origin)
  }

  return "http://127.0.0.1:18080"
}

async function request<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
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

  if (response.status === 204) {
    return null as T
  }

  return (await response.json()) as T
}

export function createPatriotApi(baseUrl = resolvePatriotApiBase()) {
  const resolvedBase = trimTrailingSlash(baseUrl)

  return {
    baseUrl: resolvedBase,
    listRuns: () => request<{ runs: RunRecord[] }>(resolvedBase, "/v1/runs"),
    listSessions: () => request<{ sessions: SessionRecord[] }>(resolvedBase, "/v1/sessions"),
    listWorkers: () => request<{ workers: WorkerRecord[] }>(resolvedBase, "/v1/workers"),
    createSession: (body: { title?: string; createdBy?: string; metadata?: Record<string, unknown> }) =>
      request<SessionRecord>(resolvedBase, "/v1/sessions", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getSession: (sessionId: string) => request<SessionRecord>(resolvedBase, `/v1/sessions/${sessionId}`),
    getSessionMessages: (sessionId: string) =>
      request<{ messages: SessionMessageRecord[] }>(resolvedBase, `/v1/sessions/${sessionId}/messages`),
    postSessionMessage: (
      sessionId: string,
      body: {
        content: string
        role?: "user" | "assistant" | "system"
        createRun?: boolean
        run?: Partial<
          Pick<RunRecord, "source" | "model" | "profile" | "mode" | "tier" | "safetyEnabled" | "createdBy">
        > & {
          workerId?: string
          operatorOs?: OperatorClientOs
        }
      },
    ) =>
      request<{ message: SessionMessageRecord; run?: RunRecord }>(
        resolvedBase,
        `/v1/sessions/${sessionId}/messages`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      ),
    resumePendingLocalRun: (
      sessionId: string,
      body: {
        source?: "web" | "telegram" | "api"
        model?: string
        profile?: "recon" | "redteam"
        mode?: "plan" | "execute"
        tier?: "recon" | "simulate" | "execute"
        safetyEnabled?: boolean
        createdBy?: string
        operatorOs?: OperatorClientOs
        workerId?: string
      },
    ) =>
      request<RunRecord>(resolvedBase, `/v1/sessions/${sessionId}/resume-pending-local-run`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getSessionRuns: (sessionId: string) => request<{ runs: RunRecord[] }>(resolvedBase, `/v1/sessions/${sessionId}/runs`),
    getSessionState: (sessionId: string) =>
      request<SessionStateResponse>(resolvedBase, `/v1/sessions/${sessionId}/state`),
    getRunArtifacts: (runId: string) => request<{ artifacts: ArtifactRecord[] }>(resolvedBase, `/v1/runs/${runId}/artifacts`),
    getRunReport: (runId: string) => request<StableRunReport>(resolvedBase, `/v1/runs/${runId}/report`),
    getRunTimeline: (runId: string) => request<{ events: TimelineEvent[] }>(resolvedBase, `/v1/runs/${runId}/timeline`),
    getFieldSensorJob: (jobId: string) => request<FieldSensorJobRecord>(resolvedBase, `/v1/field-sensors/jobs/${jobId}`),
    createFieldSensorJob: (body: FieldSensorJobRequest) =>
      request<FieldSensorJobRecord>(resolvedBase, "/v1/field-sensors/jobs", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    claimFieldSensorJob: (workerId: string) =>
      request<FieldSensorJobRecord | null>(resolvedBase, "/v1/field-sensors/jobs/claim", {
        method: "POST",
        body: JSON.stringify({ workerId }),
      }),
    completeFieldSensorJob: (jobId: string, body: { ok: boolean; result?: FieldSensorJobResult; error?: string }) =>
      request<FieldSensorJobRecord>(resolvedBase, `/v1/field-sensors/jobs/${jobId}/complete`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getRunAssignments: (runId: string) =>
      request<{ assignments: RunAssignmentRecord[] }>(resolvedBase, `/v1/runs/${runId}/assignments`),
    stopRun: (runId: string) =>
      request<RunRecord>(resolvedBase, `/v1/runs/${runId}/stop`, {
        method: "POST",
      }),
    issueFieldSensorBootstrap: (body: {
      sessionId?: string
      prompt: string
      createdBy?: string
      clientOs?: OperatorClientOs
    }) =>
      request<FieldSensorBootstrapInfo>(resolvedBase, "/v1/field-sensors/bootstrap", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getFieldSensorBootstrapStatus: (token: string) =>
      request<FieldSensorBootstrapStatusRecord>(resolvedBase, `/v1/field-sensors/bootstrap/${token}/status`),
  }
}

export const patriotApi = createPatriotApi()

export function createTimelineEventSource(runId: string, baseUrl = resolvePatriotApiBase()) {
  return new EventSource(`${trimTrailingSlash(baseUrl)}/v1/runs/${runId}/events?view=timeline`)
}

export function mergeTimelineEvents(current: TimelineEvent[], incoming: TimelineEvent[]) {
  const map = new Map(current.map((item) => [item.id, item]))
  for (const item of incoming) {
    if (item.sourceEventType === "run.heartbeat") {
      for (const [existingId, existing] of map.entries()) {
        if (existing.sourceEventType === "run.heartbeat") map.delete(existingId)
      }
    }
    map.set(item.id, item)
  }
  return [...map.values()].sort((a, b) => a.ts.localeCompare(b.ts))
}
