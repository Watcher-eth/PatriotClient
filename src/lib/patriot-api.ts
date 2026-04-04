import { getOrLoadCachedValue, invalidateCachedValue, peekCachedValue, setCachedValue } from "@/lib/request-cache"

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

export type ReconCoverage = {
  homepage_fetch: boolean
  redirect_chain: boolean
  headers: boolean
  tls: boolean
  passive_subdomains: boolean
  html_js_extraction: boolean
}

export type AssessmentRecord = {
  status: "fulfilled" | "partial" | "invalid"
  request_fulfilled: boolean
  gate_failures: string[]
  minimum_coverage: ReconCoverage
  coverage_summary: string
}

export type PreflightCheck = {
  name: string
  critical: boolean
  available: boolean
  detail?: string
}

export type PreflightRecord = {
  status: "not_run" | "passed" | "warning" | "failed"
  critical_failures: PreflightCheck[]
  optional_failures: PreflightCheck[]
  dependency_checks: PreflightCheck[]
  probe_checks: PreflightCheck[]
  summary: string
}

export type ReconDeliverableItem = {
  value: string
  confidence: "confirmed" | "inferred"
  evidence_refs: string[]
  notes?: string
}

export type SurfaceCluster = {
  label: string
  items: ReconDeliverableItem[]
}

export type ReconDeliverables = {
  domains: ReconDeliverableItem[]
  subdomains: ReconDeliverableItem[]
  entry_points: ReconDeliverableItem[]
  login_surfaces: ReconDeliverableItem[]
  admin_surfaces: ReconDeliverableItem[]
  api_endpoints: ReconDeliverableItem[]
  javascript_routes: ReconDeliverableItem[]
  third_party_integrations: ReconDeliverableItem[]
  storage_exposures: ReconDeliverableItem[]
  cloud_platform_hints: ReconDeliverableItem[]
  kubernetes_hints: ReconDeliverableItem[]
  cloud_boundaries: ReconDeliverableItem[]
  surface_clusters: SurfaceCluster[]
  trust_boundaries: ReconDeliverableItem[]
  next_actions: ReconDeliverableItem[]
}

export type AuthContextRecord = {
  name: string
  type: "anonymous" | "user" | "admin" | "custom"
}

export type ResponseDiffRecord = {
  path: string
  baseline_context: string
  comparison_context: string
  baseline_status?: number
  comparison_status?: number
  changed: boolean
  auth_only: boolean
  shape_changed: boolean
  evidence_refs: string[]
}

export type EvidenceGraphNode = {
  id: string
  kind: "host" | "url" | "service" | "api" | "identity" | "storage" | "cloud" | "boundary"
  label: string
  evidence_refs: string[]
  confidence: "confirmed" | "inferred"
}

export type EvidenceGraphEdge = {
  from: string
  to: string
  relation: string
  evidence_refs: string[]
  confidence: "confirmed" | "inferred"
}

export type EvidenceGraphRecord = {
  nodes: EvidenceGraphNode[]
  edges: EvidenceGraphEdge[]
  coverage_debt: string[]
}

export type RankedCandidate = {
  id: string
  title: string
  category: string
  confidence: "low" | "medium" | "high"
  exploitability_score: number
  blast_radius: "limited" | "moderate" | "broad"
  chainability_score: number
  requires_validation: boolean
  originating_evidence: string[]
  rationale: string
}

export type AttackPathRecord = {
  id: string
  title: string
  confidence: "low" | "medium" | "high"
  chainability_score: number
  steps: string[]
  evidence_refs: string[]
}

export type BenchmarkExpectedFinding = {
  id: string
  title: string
  category: string
  severity?: FindingRecord["severity"]
}

export type BenchmarkResult = {
  suite: string
  target_class: "seeded" | "blind" | "retest"
  expected_findings: BenchmarkExpectedFinding[]
  confirmed_found: number
  misses: number
  false_positives: number
  score_buckets: Record<string, number>
  regression_delta: number
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
  authContexts?: Array<{
    name: string
    type: "anonymous" | "user" | "admin" | "custom"
    headers?: string[]
    cookie?: string
    localStorage?: Record<string, string>
    sessionStorage?: Record<string, string>
    initScripts?: string[]
  }>
  benchmark?: {
    suite: string
    targetClass: "seeded" | "blind" | "retest"
    expectedFindings?: BenchmarkExpectedFinding[]
  }
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
  run: {
    id: string
    prompt: string
    goal: string
    source?: string
    mode?: string
    tier?: string
    safety_enabled?: boolean
    created_at?: string
    completed_at?: string
    created_by?: string
    phase?: string
    status?: string
    auth_contexts: AuthContextRecord[]
    benchmark?: BenchmarkResult
  }
  worker?: {
    id: string
    type: string
    platform: string
    capabilities: string[]
    adapter?: Record<string, unknown>
  }
  scope?: {
    constraints: Record<string, unknown>
    target_scope: string[]
  }
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
  assessment: AssessmentRecord
  preflight: PreflightRecord
  coverage_debt: string[]
  recon_deliverables: ReconDeliverables
  assets: AssetRecord[]
  findings: FindingRecord[]
  tool_evidence: ReducedToolEvidence[]
  stop_recommendations: string[]
  validation_candidates: Array<{
    id: string
    title: string
    category: string
    confidence: "confirmed" | "inferred"
    exploitability_score: number
    blast_radius: "limited" | "moderate" | "broad"
    evidence_refs: string[]
    rationale: string
    minimal_reproduction: string
    impact: string
    remediation: string
    telemetry: string
  }>
  response_diffs: ResponseDiffRecord[]
  context_sensitive_surfaces: ReconDeliverableItem[]
  evidence_graph: EvidenceGraphRecord
  ranked_candidates: RankedCandidate[]
  attack_paths: AttackPathRecord[]
  generated_at?: string
}

export type StableSessionReport = {
  schema_version: "patriot.session.v1"
  session: {
    id: string
    title: string
    status: string
    created_at: string
    updated_at: string
    created_by?: string
    current_run_id?: string
    summary?: string
    metadata: Record<string, unknown>
    auth_contexts: AuthContextRecord[]
  }
  narrative: { summary: string }
  assessment: AssessmentRecord
  preflight: PreflightRecord
  coverage_debt: string[]
  recon_deliverables: ReconDeliverables
  assets: AssetRecord[]
  findings: FindingRecord[]
  tool_evidence: ReducedToolEvidence[]
  stop_recommendations: string[]
  summary_hints: string[]
  run_ids: string[]
  validation_candidates: StableRunReport["validation_candidates"]
  response_diffs: ResponseDiffRecord[]
  context_sensitive_surfaces: ReconDeliverableItem[]
  evidence_graph: EvidenceGraphRecord
  ranked_candidates: RankedCandidate[]
  attack_paths: AttackPathRecord[]
  generated_at?: string
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

export type QueryRequestOptions = {
  forceRefresh?: boolean
}

const cacheTtls = {
  sessions: 15_000,
  sessionState: 5_000,
  sessionMessages: 5_000,
  workers: 10_000,
} as const

function buildCacheKey(baseUrl: string, resource: string, identifier?: string) {
  return [trimTrailingSlash(baseUrl), resource, identifier].filter(Boolean).join("::")
}

function getSessionsCacheKey(baseUrl: string) {
  return buildCacheKey(baseUrl, "sessions")
}

function getSessionStateCacheKey(baseUrl: string, sessionId: string) {
  return buildCacheKey(baseUrl, "session-state", sessionId)
}

function getSessionMessagesCacheKey(baseUrl: string, sessionId: string) {
  return buildCacheKey(baseUrl, "session-messages", sessionId)
}

function getWorkersCacheKey(baseUrl: string) {
  return buildCacheKey(baseUrl, "workers")
}

function invalidateSessionCache(baseUrl: string, sessionId?: string) {
  invalidateCachedValue(getSessionsCacheKey(baseUrl))
  if (!sessionId) return
  invalidateCachedValue(getSessionStateCacheKey(baseUrl, sessionId))
  invalidateCachedValue(getSessionMessagesCacheKey(baseUrl, sessionId))
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

async function requestWithCache<T>(
  baseUrl: string,
  path: string,
  cacheKey: string,
  ttlMs: number,
  options?: QueryRequestOptions,
  init?: RequestInit,
) {
  return await getOrLoadCachedValue({
    key: cacheKey,
    ttlMs,
    forceRefresh: options?.forceRefresh,
    load: async () => await request<T>(baseUrl, path, init),
  })
}

export function createPatriotApi(baseUrl = resolvePatriotApiBase()) {
  const resolvedBase = trimTrailingSlash(baseUrl)

  return {
    baseUrl: resolvedBase,
    listRuns: () => request<{ runs: RunRecord[] }>(resolvedBase, "/v1/runs"),
    listSessions: (options?: QueryRequestOptions) =>
      requestWithCache<{ sessions: SessionRecord[] }>(
        resolvedBase,
        "/v1/sessions",
        getSessionsCacheKey(resolvedBase),
        cacheTtls.sessions,
        options,
      ),
    peekSessions: () => peekCachedValue<{ sessions: SessionRecord[] }>(getSessionsCacheKey(resolvedBase)),
    primeSessions: (sessions: SessionRecord[]) =>
      setCachedValue(getSessionsCacheKey(resolvedBase), { sessions }, cacheTtls.sessions),
    prefetchSessions: async () => {
      await requestWithCache<{ sessions: SessionRecord[] }>(
        resolvedBase,
        "/v1/sessions",
        getSessionsCacheKey(resolvedBase),
        cacheTtls.sessions,
      )
    },
    listWorkers: (options?: QueryRequestOptions) =>
      requestWithCache<{ workers: WorkerRecord[] }>(
        resolvedBase,
        "/v1/workers",
        getWorkersCacheKey(resolvedBase),
        cacheTtls.workers,
        options,
      ),
    createSession: (body: { title?: string; createdBy?: string; metadata?: Record<string, unknown> }) =>
      request<SessionRecord>(resolvedBase, "/v1/sessions", {
        method: "POST",
        body: JSON.stringify(body),
      }).then((session) => {
        invalidateSessionCache(resolvedBase)
        return session
      }),
    getSession: (sessionId: string) => request<SessionRecord>(resolvedBase, `/v1/sessions/${sessionId}`),
    getSessionMessages: (sessionId: string, options?: QueryRequestOptions) =>
      requestWithCache<{ messages: SessionMessageRecord[] }>(
        resolvedBase,
        `/v1/sessions/${sessionId}/messages`,
        getSessionMessagesCacheKey(resolvedBase, sessionId),
        cacheTtls.sessionMessages,
        options,
      ),
    peekSessionMessages: (sessionId: string) =>
      peekCachedValue<{ messages: SessionMessageRecord[] }>(getSessionMessagesCacheKey(resolvedBase, sessionId)),
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
      ).then((result) => {
        invalidateSessionCache(resolvedBase, sessionId)
        return result
      }),
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
      }).then((run) => {
        invalidateSessionCache(resolvedBase, sessionId)
        return run
      }),
    getSessionRuns: (sessionId: string) => request<{ runs: RunRecord[] }>(resolvedBase, `/v1/sessions/${sessionId}/runs`),
    getSessionState: (sessionId: string, options?: QueryRequestOptions) =>
      requestWithCache<SessionStateResponse>(
        resolvedBase,
        `/v1/sessions/${sessionId}/state`,
        getSessionStateCacheKey(resolvedBase, sessionId),
        cacheTtls.sessionState,
        options,
      ),
    peekSessionState: (sessionId: string) =>
      peekCachedValue<SessionStateResponse>(getSessionStateCacheKey(resolvedBase, sessionId)),
    prefetchSessionDetail: async (sessionId: string) => {
      await Promise.all([
        requestWithCache<SessionStateResponse>(
          resolvedBase,
          `/v1/sessions/${sessionId}/state`,
          getSessionStateCacheKey(resolvedBase, sessionId),
          cacheTtls.sessionState,
        ),
        requestWithCache<{ messages: SessionMessageRecord[] }>(
          resolvedBase,
          `/v1/sessions/${sessionId}/messages`,
          getSessionMessagesCacheKey(resolvedBase, sessionId),
          cacheTtls.sessionMessages,
        ),
      ])
    },
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
