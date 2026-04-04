import {
  type CSSProperties,
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/router"
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Copy,
  FileCode2,
  FileStack,
  FolderArchive,
  LoaderCircle,
  Play,
  Plus,
  Settings,
  SendHorizontal,
  ShieldAlert,
  Square,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { ActivityStatusBadge, PatriotHeader } from "@/components/patriot/patriot-header"
import { PatriotIntro } from "@/components/patriot/patriot-intro"
import { TypewriterText } from "@/components/patriot/patriot-typewriter-text"
import { TextShimmer } from "@/components/prompt-kit/text-shimmer"
import { Button } from "@/components/ui/button"
import { TodoMark, type TodoStatus } from "@/components/ui/todo-mark"
import { cn } from "@/lib/utils"
import {
  createTimelineEventSource,
  hasRequiredCapabilities,
  mergeTimelineEvents,
  parseRequiredCapabilities,
  patriotApi,
  type ArtifactRecord,
  type AssetRecord,
  type FieldSensorBootstrapInfo,
  type FieldSensorBootstrapStatusRecord,
  type FindingRecord,
  type ReducedToolEvidence,
  type RunAssignmentRecord,
  type RunRecord,
  type SessionMessageRecord,
  type SessionRecord,
  type SessionStateResponse,
  type TimelineEvent,
  type WorkerRecord,
} from "@/lib/patriot-api"

type ViewTab = "summary" | "findings" | "assets" | "evidence" | "artifacts"
type RightRailStage = "pre" | "during" | "after"
type NextActionTodo = {
  id: string
  label: string
  status: TodoStatus
  meta?: string
}

const tabs: Array<{ id: ViewTab; label: string; icon: typeof FileStack }> = [
  { id: "summary", label: "Summary", icon: FileStack },
  { id: "findings", label: "Findings", icon: ShieldAlert },
  { id: "assets", label: "Assets", icon: Boxes },
  { id: "evidence", label: "Evidence", icon: FileCode2 },
  { id: "artifacts", label: "Artifacts", icon: FolderArchive },
]

const EMPTY_RUNS: RunRecord[] = []

type OperatorRunProfile = "recon" | "redteam"
type OperatorModel = "claude-sonnet-4-6" | "claude-opus-4-6"
type OperatorWorkerSelection = "auto" | string

type OperatorRunSettings = {
  model: OperatorModel
  profile: OperatorRunProfile
  workerId: OperatorWorkerSelection
}

const CONSOLE_ANIMATION_STORAGE_KEY = "patriot-console-animated-v1"
const CONSOLE_ANIMATION_FRESHNESS_MS = 15_000
const MAX_CONSOLE_ANIMATION_KEYS = 600

let animatedConsoleEntryCache: Set<string> | null = null

const modelOptions: Array<{ value: OperatorModel; label: string }> = [
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
]

const profileOptions: Array<{ value: OperatorRunProfile; label: string }> = [
  { value: "recon", label: "Recon" },
  { value: "redteam", label: "Redteam" },
]

function buildRunConfig(settings: OperatorRunSettings) {
  const isRedteam = settings.profile === "redteam"
  const tier: RunRecord["tier"] = isRedteam ? "execute" : "recon"
  return {
    source: "web" as const,
    model: settings.model,
    profile: settings.profile,
    mode: "execute" as const,
    tier,
    safetyEnabled: false,
    createdBy: "operator",
    workerId: settings.workerId === "auto" ? undefined : settings.workerId,
  }
}

function detectBrowserOs(): "macos" | "windows" | "linux" | "unknown" {
  if (typeof navigator === "undefined") return "unknown"
  const value = [navigator.userAgent, navigator.platform].join(" ").toLowerCase()
  if (value.includes("mac")) return "macos"
  if (value.includes("win")) return "windows"
  if (value.includes("linux")) return "linux"
  return "unknown"
}

function formatTime(value?: string) {
  if (!value) return "--:--"
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatDateTime(value?: string) {
  if (!value) return "Unknown"
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function loadAnimatedConsoleEntryCache() {
  if (animatedConsoleEntryCache) return animatedConsoleEntryCache
  if (typeof window === "undefined") {
    animatedConsoleEntryCache = new Set<string>()
    return animatedConsoleEntryCache
  }

  try {
    const raw = window.sessionStorage.getItem(CONSOLE_ANIMATION_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as string[]) : []
    animatedConsoleEntryCache = new Set(parsed)
  } catch {
    animatedConsoleEntryCache = new Set<string>()
  }

  return animatedConsoleEntryCache
}

function persistAnimatedConsoleEntryCache(cache: Set<string>) {
  if (typeof window === "undefined") return
  const compact = [...cache].slice(-MAX_CONSOLE_ANIMATION_KEYS)
  animatedConsoleEntryCache = new Set(compact)
  window.sessionStorage.setItem(CONSOLE_ANIMATION_STORAGE_KEY, JSON.stringify(compact))
}

function shouldAnimateConsoleEntryOnce(key: string, at?: string) {
  const cache = loadAnimatedConsoleEntryCache()
  if (cache.has(key)) return false

  cache.add(key)
  persistAnimatedConsoleEntryCache(cache)

  if (!at) return false
  const timestamp = new Date(at).getTime()
  if (!Number.isFinite(timestamp)) return false
  return Date.now() - timestamp < CONSOLE_ANIMATION_FRESHNESS_MS
}

function runStatusTone(status?: RunRecord["status"]) {
  switch (status) {
    case "running":
      return "border-[#ec3844]/40 bg-[#1b0e12] text-[#f28d94]"
    case "completed":
      return "border-white/10 bg-white/[0.03] text-white/75"
    case "failed":
      return "border-[#ec3844]/50 bg-[#201014] text-[#ffb3b8]"
    case "stopped":
      return "border-[#5a5f6b] bg-[#15181d] text-white/70"
    default:
      return "border-white/10 bg-white/[0.03] text-white/60"
  }
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

function coverageChecklistLabel(key: string) {
  return key.replace(/_/g, " ")
}

function hasAssessmentEvidence(report?: {
  tool_evidence?: Array<unknown>
  assets?: Array<unknown>
  findings?: Array<unknown>
}) {
  return Boolean(
    report &&
      ((report.tool_evidence?.length ?? 0) > 0 || (report.assets?.length ?? 0) > 0 || (report.findings?.length ?? 0) > 0),
  )
}

function hasReconDeliverablesContent(deliverables?: {
  domains?: Array<unknown>
  subdomains?: Array<unknown>
  entry_points?: Array<unknown>
  login_surfaces?: Array<unknown>
  admin_surfaces?: Array<unknown>
  api_endpoints?: Array<unknown>
  javascript_routes?: Array<unknown>
  third_party_integrations?: Array<unknown>
  storage_exposures?: Array<unknown>
  surface_clusters?: Array<{ items?: Array<unknown> }>
  trust_boundaries?: Array<unknown>
  next_actions?: Array<unknown>
}) {
  if (!deliverables) return false

  return [
    deliverables.domains,
    deliverables.subdomains,
    deliverables.entry_points,
    deliverables.login_surfaces,
    deliverables.admin_surfaces,
    deliverables.api_endpoints,
    deliverables.javascript_routes,
    deliverables.third_party_integrations,
    deliverables.storage_exposures,
    ...(deliverables.surface_clusters?.map((cluster) => cluster.items) ?? []),
    deliverables.trust_boundaries,
    deliverables.next_actions,
  ].some((items) => (items?.length ?? 0) > 0)
}

function compactToolName(tool: string) {
  return tool.split("__").filter(Boolean).at(-1) ?? tool
}

function humanizeTodoToken(value: string) {
  return value.replace(/[_-]+/g, " ").trim()
}

function formatAssignmentTodoLabel(assignment: RunAssignmentRecord) {
  const capability = humanizeTodoToken(assignment.capabilityFamily)
  const targetCount = assignment.targetScope?.length ?? 0

  const base =
    assignment.kind === "discovery"
      ? `Run ${capability} discovery`
      : assignment.kind === "enrichment"
        ? `Enrich ${capability} evidence`
        : assignment.kind === "validation"
          ? `Validate ${capability}`
          : `Follow up on ${capability}`

  if (targetCount === 1) {
    return `${base} for ${assignment.targetScope[0]}`
  }

  if (targetCount > 1) {
    return `${base} across ${targetCount} targets`
  }

  return base
}

function formatAssignmentTodoMeta(assignment: RunAssignmentRecord, workerName?: string) {
  const details = [
    workerName ? `${workerName}${assignment.adapterKind ? ` / ${assignment.adapterKind}` : ""}` : undefined,
    assignment.notes?.[0],
    assignment.error ? `Reason: ${assignment.error}` : undefined,
  ].filter(Boolean)

  return details.join(" / ")
}

function mapAssignmentStatusToTodoStatus(status: RunAssignmentRecord["status"]): TodoStatus {
  switch (status) {
    case "running":
      return "running"
    case "completed":
      return "success"
    case "failed":
    case "skipped":
      return "error"
    default:
      return "scheduled"
  }
}

function latestSupervisorRequiredActions(timelineEvents: TimelineEvent[], runId?: string | null) {
  for (let index = timelineEvents.length - 1; index >= 0; index -= 1) {
    const event = timelineEvents[index]
    if (event.sourceEventType !== "supervisor.verdict") continue
    if (runId && event.runId !== runId) continue

    const requiredActions = Array.isArray(event.data?.required_actions)
      ? event.data.required_actions.map((item) => String(item)).filter(Boolean)
      : []

    if (requiredActions.length === 0) continue

    return {
      verdict: typeof event.data?.verdict === "string" ? event.data.verdict : undefined,
      requiredActions,
    }
  }

  return null
}

function todoStatusTone(status: TodoStatus) {
  switch (status) {
    case "running":
      return "text-sky-300"
    case "success":
      return "text-[#9fe8b0]"
    case "error":
      return "text-[#ffadb3]"
    default:
      return "text-white/38"
  }
}

function setupOptionDescription(option: FieldSensorBootstrapInfo["setup"][number]) {
  if (option.kind === "desktop") return "Install the native Electron client and pair it with Patriot."
  if (option.kind === "script") return "Run a one-time shell setup that installs and launches the field worker."
  if (option.kind === "mobile") return "Install and pair the native mobile field worker."
  return "Setup option"
}

function compareVersionStrings(left?: string, right?: string) {
  if (!left && !right) return 0
  if (!left) return -1
  if (!right) return 1
  const leftParts = left.split(".").map((segment) => Number(segment.match(/^\d+/)?.[0] ?? 0))
  const rightParts = right.split(".").map((segment) => Number(segment.match(/^\d+/)?.[0] ?? 0))
  const length = Math.max(leftParts.length, rightParts.length)
  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] ?? 0
    const rightValue = rightParts[index] ?? 0
    if (leftValue > rightValue) return 1
    if (leftValue < rightValue) return -1
  }
  return 0
}

function workerHealthTone(health?: WorkerRecord["adapter"] extends { health?: infer T } ? T : string) {
  switch (health) {
    case "healthy":
      return "border-white/10 bg-white/[0.04] text-white/72"
    case "degraded":
      return "border-[#ec3844]/35 bg-[#1a0d11] text-[#ffb3b8]"
    case "blocked":
      return "border-[#ec3844]/55 bg-[#220d12] text-[#ff8e98]"
    default:
      return "border-white/10 bg-white/[0.03] text-white/52"
  }
}

function workerHealthLabel(health?: WorkerRecord["adapter"] extends { health?: infer T } ? T : string) {
  switch (health) {
    case "blocked":
      return "UPDATE REQUIRED"
    default:
      return health ?? "unknown"
  }
}

function parseJsonRecord(value: string) {
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function getNestedRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function getToolResultPayload(event: TimelineEvent) {
  const eventData = getNestedRecord(event.data)
  if (!eventData) return null

  const directResponse = getNestedRecord(eventData.tool_response)
  if (directResponse) return directResponse

  if (Array.isArray(eventData.tool_response)) {
    const first = eventData.tool_response[0]
    const firstRecord = getNestedRecord(first)
    if (typeof firstRecord?.text === "string") return parseJsonRecord(firstRecord.text)
  }

  return parseJsonRecord(event.body)
}

function getToolTarget(event: TimelineEvent, payload?: Record<string, unknown> | null) {
  const eventData = getNestedRecord(event.data)
  const toolInput = getNestedRecord(eventData?.tool_input)
  const candidates = [
    payload?.target,
    toolInput?.target,
    toolInput?.host,
    toolInput?.domain,
    toolInput?.url,
    toolInput?.location,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim()
  }

  if (Array.isArray(toolInput?.search_query)) {
    const first = getNestedRecord(toolInput.search_query[0])
    if (typeof first?.q === "string" && first.q.trim()) return first.q.trim()
  }

  return null
}

function getToolFacts(payload: Record<string, unknown> | null) {
  if (!payload) return []

  const facts: string[] = []
  const summary = getNestedRecord(payload.summary)

  if (typeof payload.status === "string") facts.push(`Status: ${payload.status}`)
  if (typeof summary?.coverage === "string") facts.push(`Coverage: ${summary.coverage}`)
  if (typeof summary?.resolved_ips_count === "number") facts.push(`Resolved IPs: ${summary.resolved_ips_count}`)
  if (Array.isArray(summary?.resolved_ips)) {
    const ips = summary.resolved_ips.filter((item): item is string => typeof item === "string")
    if (ips.length > 0) facts.push(`IPs: ${ips.join(", ")}`)
  }
  if (Array.isArray(summary?.tls_ports_probed)) {
    const ports = summary.tls_ports_probed.map((item) => String(item))
    facts.push(`TLS ports: ${ports.length > 0 ? ports.join(", ") : "none"}`)
  }
  if (typeof summary?.tls_subject === "string" && summary.tls_subject) facts.push(`TLS subject: ${summary.tls_subject}`)
  if (typeof summary?.tls_issuer === "string" && summary.tls_issuer) facts.push(`TLS issuer: ${summary.tls_issuer}`)
  if (Array.isArray(payload.key_facts)) {
    for (const fact of payload.key_facts) {
      if (typeof fact === "string" && fact.trim()) facts.push(fact.trim())
    }
  }
  if (Array.isArray(summary?.evidence_gaps)) {
    const gaps = summary.evidence_gaps.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    if (gaps.length > 0) facts.push(`Gaps: ${gaps.join(", ")}`)
  }

  return facts.slice(0, 5)
}

function isDuplicatePendingLocalSetupMessage({
  message,
  pendingLocalPrompt,
  minimumPendingLocalVersion,
  pendingLocalCommand,
}: {
  message: SessionMessageRecord
  pendingLocalPrompt: string | null
  minimumPendingLocalVersion?: string
  pendingLocalCommand?: string
}) {
  if (message.role === "user") return false

  const content = message.content
  const hasSetupIntro = /this request needs a local field sensor/i.test(content)
  const hasSetupHeading = /setup options:/i.test(content)
  const hasContinueSystemLine = /continuing pending local request via/i.test(content)
  const hasOriginalRequest = pendingLocalPrompt ? content.includes(`Original request: ${pendingLocalPrompt}`) : false
  const hasMinimumVersion = minimumPendingLocalVersion
    ? content.includes(`Minimum supported field worker version: ${minimumPendingLocalVersion}`)
    : false
  const hasCommand = pendingLocalCommand ? content.includes(pendingLocalCommand) : false

  return hasSetupIntro || hasSetupHeading || hasContinueSystemLine || hasOriginalRequest || hasMinimumVersion || hasCommand
}

function formatTraceEvent(event: TimelineEvent) {
  if (event.kind === "tool") {
    const eventData = getNestedRecord(event.data)
    const toolName = compactToolName(
      String(eventData?.tool ?? eventData?.tool_name ?? event.title.replace(/^Tool (started|finished|running):\s*/i, ""))
    )
    const payload = event.sourceEventType === "tool.result" ? getToolResultPayload(event) : null
    const target = getToolTarget(event, payload)
    const state =
      event.sourceEventType === "tool.intent"
        ? "Started"
        : event.sourceEventType === "tool.progress"
          ? "Running"
          : "Finished"
    const label = `${state}: ${toolName}${target ? ` => ${target}` : ""}`
    return {
      label,
      facts: event.sourceEventType === "tool.result" ? getToolFacts(payload) : [],
    }
  }

  return {
    label: [event.title, event.body].map((segment) => segment.trim()).filter(Boolean).join(" / "),
    facts: [] as string[],
  }
}

function getTraceToolSignature(event: TimelineEvent) {
  if (event.kind !== "tool") return null
  const eventData = getNestedRecord(event.data)
  const toolName = compactToolName(
    String(eventData?.tool ?? eventData?.tool_name ?? event.title.replace(/^Tool (started|finished|running):\s*/i, ""))
  )
  const payload = event.sourceEventType === "tool.result" ? getToolResultPayload(event) : null
  const target = getToolTarget(event, payload) ?? ""
  return `${event.runId}::${toolName}::${target}`
}

type PatriotDashboardProps = {
  sessionId?: string
  forceNewChat?: boolean
  onSessionChange?: (sessionId: string) => void
}

export function PatriotDashboard({
  sessionId: routeSessionId,
  forceNewChat = false,
  onSessionChange,
}: PatriotDashboardProps = {}) {
  const router = useRouter()
  const initialCachedSessionState = routeSessionId ? patriotApi.peekSessionState(routeSessionId)?.value ?? null : null
  const initialCachedMessages = routeSessionId ? patriotApi.peekSessionMessages(routeSessionId)?.value.messages ?? [] : []
  const chatScrollRef = useRef<HTMLDivElement | null>(null)
  const chatContentRef = useRef<HTMLDivElement | null>(null)
  const shouldStickChatToBottomRef = useRef(true)
  const shouldUseInstantChatScrollRef = useRef(true)
  const selectedRunIdRef = useRef<string | null>(null)
  const selectedSessionIdRef = useRef<string | null>(routeSessionId ?? null)
  const sessionLoadRequestIdRef = useRef(0)
  const traceSessionIdRef = useRef<string | null>(null)
  const [showIntro, setShowIntro] = useState(true)
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [workers, setWorkers] = useState<WorkerRecord[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(routeSessionId ?? null)
  const deferredSessionId = useDeferredValue(selectedSessionId)
  const [sessionState, setSessionState] = useState<SessionStateResponse | null>(initialCachedSessionState)
  const [messages, setMessages] = useState<SessionMessageRecord[]>(initialCachedMessages)
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [artifacts, setArtifacts] = useState<ArtifactRecord[]>([])
  const [runAssignments, setRunAssignments] = useState<RunAssignmentRecord[]>([])
  const [draft, setDraft] = useState("")
  const [activeTab, setActiveTab] = useState<ViewTab>("summary")
  const [isLoading, setIsLoading] = useState(routeSessionId !== undefined && initialCachedSessionState === null)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [isResumingPendingLocalRun, setIsResumingPendingLocalRun] = useState(false)
  const [copiedSetupCommand, setCopiedSetupCommand] = useState(false)
  const [setupInProgressToken, setSetupInProgressToken] = useState<string | null>(null)
  const [bootstrapStatus, setBootstrapStatus] = useState<FieldSensorBootstrapStatusRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [runSettings, setRunSettings] = useState<OperatorRunSettings>({
    model: "claude-sonnet-4-6",
    profile: "recon",
    workerId: "auto",
  })

  const currentSession = sessionState?.session ?? sessions.find((item) => item.id === selectedSessionId) ?? null
  const runs = sessionState?.runs ?? EMPTY_RUNS
  const orderedSessionRuns = useMemo(
    () => runs.toSorted((left, right) => left.createdAt.localeCompare(right.createdAt)),
    [runs],
  )
  const orderedSessionRunIds = useMemo(() => orderedSessionRuns.map((run) => run.id), [orderedSessionRuns])
  const orderedSessionRunIdsKey = useMemo(() => orderedSessionRunIds.join("|"), [orderedSessionRunIds])
  const selectedRun =
    runs.find((run) => run.id === selectedRunId) ??
    runs.find((run) => run.id === currentSession?.currentRunId) ??
    runs[0] ??
    null
  const isSelectedRunLive = selectedRun?.status === "queued" || selectedRun?.status === "running"
  const isSelectedRunConcluded =
    selectedRun?.status === "completed" || selectedRun?.status === "failed" || selectedRun?.status === "stopped"
  const rightRailStage: RightRailStage = selectedRun ? (isSelectedRunConcluded ? "after" : "during") : "pre"
  const pendingLocalPrompt =
    currentSession?.metadata && typeof currentSession.metadata.pending_local_prompt === "string"
      ? currentSession.metadata.pending_local_prompt
      : null
  const pendingLocalRequiredCapabilities = parseRequiredCapabilities(
    currentSession?.metadata?.pending_local_required_capabilities,
  )
  const pendingLocalBootstrap =
    currentSession?.metadata &&
    currentSession.metadata.pending_local_bootstrap &&
    typeof currentSession.metadata.pending_local_bootstrap === "object"
      ? (currentSession.metadata.pending_local_bootstrap as FieldSensorBootstrapInfo)
      : null
  const pendingLocalRecommendedClient =
    currentSession?.metadata && typeof currentSession.metadata.pending_local_recommended_client === "string"
      ? currentSession.metadata.pending_local_recommended_client
      : null
  const pendingLocalResumeRequired = currentSession?.metadata?.pending_local_resume_required === true
  const minimumPendingLocalVersion = pendingLocalBootstrap?.minimumVersion
  const preferredFieldWorkerId =
    currentSession?.metadata && typeof currentSession.metadata.field_sensor_worker_id === "string"
      ? currentSession.metadata.field_sensor_worker_id
      : null
  const onlineFieldWorker =
    workers.find(
      (worker) =>
        worker.type === "field_sensor" &&
        worker.status === "online" &&
        (!preferredFieldWorkerId || worker.id === preferredFieldWorkerId),
    ) ??
    workers.find((worker) => worker.type === "field_sensor" && worker.status === "online") ??
    null
  const fieldWorkerNeedsUpgrade =
    Boolean(onlineFieldWorker) &&
    Boolean(minimumPendingLocalVersion) &&
    compareVersionStrings(onlineFieldWorker?.adapter?.version, minimumPendingLocalVersion) < 0
  const compatibleOnlineFieldWorker =
    workers.find(
      (worker) =>
        worker.type === "field_sensor" &&
        worker.status === "online" &&
        (!preferredFieldWorkerId || worker.id === preferredFieldWorkerId) &&
        worker.adapter?.health !== "blocked" &&
        (!minimumPendingLocalVersion ||
          compareVersionStrings(worker.adapter?.version, minimumPendingLocalVersion) >= 0) &&
        hasRequiredCapabilities(worker, pendingLocalRequiredCapabilities),
    ) ??
    workers.find(
      (worker) =>
        worker.type === "field_sensor" &&
        worker.status === "online" &&
        worker.adapter?.health !== "blocked" &&
        (!minimumPendingLocalVersion ||
          compareVersionStrings(worker.adapter?.version, minimumPendingLocalVersion) >= 0) &&
        hasRequiredCapabilities(worker, pendingLocalRequiredCapabilities),
    ) ??
    null
  const hasCompatibleReadyWorker = Boolean(compatibleOnlineFieldWorker)
  const hasFieldWorkerCapabilityMismatch =
    Boolean(pendingLocalPrompt) && Boolean(onlineFieldWorker) && !compatibleOnlineFieldWorker && !fieldWorkerNeedsUpgrade
  const shouldShowPendingLocalBanner =
    Boolean(pendingLocalPrompt) &&
    (Boolean(pendingLocalBootstrap) ||
      hasFieldWorkerCapabilityMismatch ||
      !onlineFieldWorker ||
      (pendingLocalResumeRequired && Boolean(compatibleOnlineFieldWorker)))
  const macOsDesktopSetupOption = pendingLocalBootstrap?.setup.find((option) => option.kind === "desktop") ?? null
  const macOsScriptSetupOption = pendingLocalBootstrap?.setup.find((option) => option.kind === "script") ?? null
  const effectiveBootstrapStatus =
    pendingLocalBootstrap && bootstrapStatus?.token === pendingLocalBootstrap.token ? bootstrapStatus.status : null
  const isSetupActive =
    Boolean(pendingLocalBootstrap) &&
    setupInProgressToken === pendingLocalBootstrap?.token &&
    effectiveBootstrapStatus !== "enrolled" &&
    effectiveBootstrapStatus !== "expired"
  const isSetupReady =
    effectiveBootstrapStatus === "enrolled" || hasCompatibleReadyWorker
  const hasSetupFailed = effectiveBootstrapStatus === "expired"
  const headerStatusSlot = routeSessionId ? (
    <div className="min-w-0 max-w-[320px] text-right">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Session ID</div>
      <div className="truncate text-[11px] uppercase tracking-[0.16em] text-white/72" title={routeSessionId}>
        {routeSessionId}
      </div>
    </div>
  ) : null

  const syncSessionsList = async () => {
    const response = await patriotApi.listSessions()
    startTransition(() => {
      setSessions(response.sessions)
      setSelectedSessionId((current) => {
        if (current || routeSessionId || forceNewChat || response.sessions.length === 0) return current
        return response.sessions[0]!.id
      })
    })
  }

  const resetToBlankConsole = () => {
    sessionLoadRequestIdRef.current += 1
    traceSessionIdRef.current = null
    selectedSessionIdRef.current = null
    selectedRunIdRef.current = null
    startTransition(() => {
      setSelectedSessionId(null)
      setSelectedRunId(null)
      setSessionState(null)
      setMessages([])
      setTimelineEvents([])
      setArtifacts([])
      setRunAssignments([])
      setDraft("")
      setError(null)
      setActiveTab("summary")
    })
  }

  const createFreshSession = useEffectEvent(async () => {
    const session = await patriotApi.createSession({
      title: `Session ${new Date().toLocaleDateString()}`,
      createdBy: "operator",
    })

    sessionLoadRequestIdRef.current += 1
    startTransition(() => {
      setSessions((current) => {
        const next = [...current.filter((item) => item.id !== session.id), session]
        return next.toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      })
      setSelectedSessionId(session.id)
      setMessages([])
      setSessionState(null)
      setSelectedRunId(null)
      setTimelineEvents([])
      setArtifacts([])
      setRunAssignments([])
    })

    onSessionChange?.(session.id)
    if (!onSessionChange && router.query.newChat === "1") {
      await router.replace("/", undefined, { shallow: true })
    }
    void syncSessionsList().catch((err) => {
      setError(err instanceof Error ? err.message : String(err))
    })
    return session.id
  })

  const loadSessionState = async (sessionId: string) => {
    const requestId = ++sessionLoadRequestIdRef.current
    const hasCachedSession = patriotApi.peekSessionState(sessionId) !== null
    if (!hasCachedSession) {
      setIsLoading(true)
    }
    setError(null)
    try {
      const [stateResponse, messagesResponse] = await Promise.all([
        patriotApi.getSessionState(sessionId, { forceRefresh: hasCachedSession }),
        patriotApi.getSessionMessages(sessionId, { forceRefresh: hasCachedSession }),
      ])

      if (requestId !== sessionLoadRequestIdRef.current || selectedSessionIdRef.current !== sessionId) return

      startTransition(() => {
        setSessionState(stateResponse)
        setMessages(messagesResponse.messages)
        setSessions((current) => {
          const next = [...current.filter((item) => item.id !== stateResponse.session.id), stateResponse.session]
          return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        })
        setSelectedRunId((current) => {
          if (current && stateResponse.runs.some((run) => run.id === current)) return current
          return stateResponse.session.currentRunId ?? stateResponse.runs[0]?.id ?? null
        })
      })
    } catch (err) {
      if (requestId === sessionLoadRequestIdRef.current) {
        setError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      if (requestId === sessionLoadRequestIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  const refreshSessions = useEffectEvent(async () => {
    try {
      await syncSessionsList()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  })

  const refreshWorkers = useEffectEvent(async () => {
    try {
      const response = await patriotApi.listWorkers()
      startTransition(() => {
        setWorkers(response.workers)
        setRunSettings((current) => {
          if (current.workerId === "auto") return current
          return response.workers.some((worker) => worker.id === current.workerId)
            ? current
            : { ...current, workerId: "auto" }
        })
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  })

  const openSetupOption = (option: FieldSensorBootstrapInfo["setup"][number]) => {
    if (pendingLocalBootstrap) setSetupInProgressToken(pendingLocalBootstrap.token)
    const target = option.installUrl ?? option.deepLink ?? option.scriptUrl
    if (!target) return
    window.open(target, option.deepLink && !option.installUrl ? "_self" : "_blank", "noopener,noreferrer")
  }

  const copySetupCommand = async (command: string) => {
    try {
      if (pendingLocalBootstrap) setSetupInProgressToken(pendingLocalBootstrap.token)
      await navigator.clipboard.writeText(command)
      setCopiedSetupCommand(true)
      window.setTimeout(() => setCopiedSetupCommand(false), 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to copy setup command.")
    }
  }

  const refreshSession = useEffectEvent(async (sessionId: string) => {
    await loadSessionState(sessionId)
  })

  const refreshRunArtifacts = useEffectEvent(async (runId: string) => {
    try {
      const response = await patriotApi.getRunArtifacts(runId)
      startTransition(() => setArtifacts(response.artifacts))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  })

  const refreshRunAssignments = useEffectEvent(async (runId: string) => {
    try {
      const response = await patriotApi.getRunAssignments(runId)
      startTransition(() => setRunAssignments(response.assignments))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  })

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 2100)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    void refreshSessions()
  }, [])

  useEffect(() => {
    void refreshWorkers()
  }, [])

  useEffect(() => {
    if (routeSessionId) {
      const cachedSessionState = patriotApi.peekSessionState(routeSessionId)?.value ?? null
      const cachedMessages = patriotApi.peekSessionMessages(routeSessionId)?.value.messages ?? []
      sessionLoadRequestIdRef.current += 1
      startTransition(() => {
        setSelectedSessionId(routeSessionId)
        setSelectedRunId(null)
        setSessionState(cachedSessionState)
        setMessages(cachedMessages)
        setTimelineEvents([])
        setArtifacts([])
        setRunAssignments([])
        setError(null)
      })
      setIsLoading(cachedSessionState === null)
      return
    }

    if (forceNewChat) {
      resetToBlankConsole()
      void createFreshSession().catch((err) => {
        setError(err instanceof Error ? err.message : String(err))
      })
    }
  }, [createFreshSession, forceNewChat, routeSessionId])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshWorkers()
      if (selectedSessionId) void refreshSession(selectedSessionId)
    }, 10_000)

    return () => window.clearInterval(timer)
  }, [selectedSessionId])

  useEffect(() => {
    if (!deferredSessionId) return
    void refreshSession(deferredSessionId)
  }, [deferredSessionId])

  useEffect(() => {
    selectedRunIdRef.current = selectedRunId
  }, [selectedRunId])

  useEffect(() => {
    selectedSessionIdRef.current = selectedSessionId
  }, [selectedSessionId])

  useEffect(() => {
    if (!pendingLocalBootstrap?.token) {
      startTransition(() => setBootstrapStatus(null))
      setSetupInProgressToken(null)
      return
    }

    let cancelled = false

    const refreshBootstrapStatus = async () => {
      try {
        const response = await patriotApi.getFieldSensorBootstrapStatus(pendingLocalBootstrap.token)
        if (cancelled) return
        startTransition(() => setBootstrapStatus(response))
        if (response.status === "enrolled") {
          setSetupInProgressToken(pendingLocalBootstrap.token)
          void refreshWorkers()
          if (selectedSessionId) void refreshSession(selectedSessionId)
        }
        if (response.status === "expired") {
          setSetupInProgressToken(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    }

    void refreshBootstrapStatus()
    const timer = window.setInterval(() => {
      void refreshBootstrapStatus()
    }, 2000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [pendingLocalBootstrap?.token, selectedSessionId])

  useEffect(() => {
    if (!selectedRunId) {
      setArtifacts([])
      setRunAssignments([])
      return
    }

    void refreshRunArtifacts(selectedRunId)
    void refreshRunAssignments(selectedRunId)
  }, [selectedRunId])

  useEffect(() => {
    const activeSessionId = deferredSessionId ?? selectedSessionId
    const runIds = orderedSessionRunIds

    if (!activeSessionId) {
      traceSessionIdRef.current = null
      startTransition(() => {
        setTimelineEvents((current) => (current.length === 0 ? current : []))
      })
      return
    }

    if (traceSessionIdRef.current !== activeSessionId) {
      traceSessionIdRef.current = activeSessionId
      startTransition(() => {
        setTimelineEvents((current) => (current.length === 0 ? current : []))
      })
    }

    if (runIds.length === 0) {
      startTransition(() => {
        setTimelineEvents((current) => (current.length === 0 ? current : []))
      })
      return
    }

    let closed = false

    const loadTimelines = async () => {
      try {
        const responses = await Promise.all(runIds.map((runId) => patriotApi.getRunTimeline(runId)))
        if (closed) return
        const merged = mergeTimelineEvents([], responses.flatMap((response) => response.events))
        startTransition(() => {
          setTimelineEvents((current) => mergeTimelineEvents(current.filter((event) => runIds.includes(event.runId)), merged))
        })
      } catch (err) {
        if (!closed) setError(err instanceof Error ? err.message : String(err))
      }
    }

    void loadTimelines()

    const sources = runIds.map((runId) => {
      const source = createTimelineEventSource(runId)
      source.onmessage = (event) => {
        if (closed) return
        try {
          const payload = JSON.parse(event.data) as TimelineEvent
          startTransition(() => setTimelineEvents((current) => mergeTimelineEvents(current, [payload])))
          if (payload.kind === "status" && ["complete", "failed"].includes(payload.status ?? "")) {
            if (activeSessionId) void refreshSession(activeSessionId)
            if (selectedRunIdRef.current === payload.runId) {
              void refreshRunArtifacts(payload.runId)
              void refreshRunAssignments(payload.runId)
            }
          }
        } catch {
          // Ignore malformed timeline frames.
        }
      }
      source.onerror = () => source.close()
      return source
    })

    return () => {
      closed = true
      for (const source of sources) source.close()
    }
  }, [deferredSessionId, orderedSessionRunIds, orderedSessionRunIdsKey, selectedSessionId])

  const startNewChat = async () => {
    setIsCreatingSession(true)
    setError(null)
    try {
      resetToBlankConsole()
      await createFreshSession()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsCreatingSession(false)
    }
  }

  const ensureSession = async () => {
    if (selectedSessionId) return selectedSessionId
    return await createFreshSession()
  }

  const submitMessage = async () => {
    const content = draft.trim()
    if (!content) return

    setIsSubmitting(true)
    setError(null)
    try {
      const sessionId = await ensureSession()
      const result = await patriotApi.postSessionMessage(sessionId, {
        role: "user",
        content,
        createRun: true,
        run: {
          ...buildRunConfig(runSettings),
          operatorOs: detectBrowserOs(),
        },
      })
      setDraft("")
      if (result.run) {
        startTransition(() => {
          setSelectedRunId(result.run?.id ?? null)
        })
      }
      await loadSessionState(sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const stopRun = async () => {
    if (!selectedRunId) return
    setIsStopping(true)
    try {
      await patriotApi.stopRun(selectedRunId)
      if (selectedSessionId) await loadSessionState(selectedSessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsStopping(false)
    }
  }

  const continuePendingLocalRun = useEffectEvent(async () => {
    if (!selectedSessionId) return
    setIsResumingPendingLocalRun(true)
    setError(null)
    try {
      const run = await patriotApi.resumePendingLocalRun(selectedSessionId, {
        ...buildRunConfig(runSettings),
        operatorOs: detectBrowserOs(),
        workerId: compatibleOnlineFieldWorker?.id ?? undefined,
      })
      startTransition(() => {
        setSelectedRunId(run.id)
      })
      await loadSessionState(selectedSessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsResumingPendingLocalRun(false)
    }
  })

  const traceState = useMemo(() => {
    const visibleTimelineEvents = timelineEvents.filter((event) => event.kind !== "artifact")
    return {
      visibleTimelineEvents,
      orderedSessionRuns,
      hasTrace: orderedSessionRuns.length > 0 || visibleTimelineEvents.length > 0,
    }
  }, [orderedSessionRuns, timelineEvents])
  const tabCounts = useMemo<Record<ViewTab, number>>(
    () => ({
      summary: runs.length,
      findings: sessionState?.report.findings.length ?? 0,
      assets: sessionState?.report.assets.length ?? 0,
      evidence: sessionState?.report.tool_evidence.length ?? 0,
      artifacts: artifacts.length,
    }),
    [artifacts.length, runs.length, sessionState?.report.assets.length, sessionState?.report.findings.length, sessionState?.report.tool_evidence.length],
  )
  const visibleMessages = useMemo(
    () =>
      messages.filter(
        (message) =>
          !isDuplicatePendingLocalSetupMessage({
            message,
            pendingLocalPrompt,
            minimumPendingLocalVersion,
            pendingLocalCommand: pendingLocalBootstrap?.command,
          }),
      ),
    [messages, minimumPendingLocalVersion, pendingLocalBootstrap?.command, pendingLocalPrompt],
  )
  const autoContinueKeyRef = useRef<string | null>(null)
  const previousRightRailStage = useRef<RightRailStage>(rightRailStage)
  const scrollChatToBottom = useEffectEvent((behavior: ScrollBehavior = "smooth") => {
    const container = chatScrollRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior })
  })

  useEffect(() => {
    if (previousRightRailStage.current === "during" && rightRailStage === "after") {
      startTransition(() => setActiveTab("summary"))
    }
    previousRightRailStage.current = rightRailStage
  }, [rightRailStage])

  useEffect(() => {
    const autoContinueKey =
      selectedSessionId && pendingLocalPrompt && compatibleOnlineFieldWorker
        ? `${selectedSessionId}:${pendingLocalPrompt}:${compatibleOnlineFieldWorker.id}`
        : null

    if (!autoContinueKey) return
    if (!isSetupReady || !shouldShowPendingLocalBanner || isResumingPendingLocalRun) return
    if (autoContinueKeyRef.current === autoContinueKey) return

    autoContinueKeyRef.current = autoContinueKey
    void continuePendingLocalRun()
  }, [
    compatibleOnlineFieldWorker,
    isResumingPendingLocalRun,
    isSetupReady,
    pendingLocalPrompt,
    selectedSessionId,
    shouldShowPendingLocalBanner,
  ])

  useEffect(() => {
    const container = chatScrollRef.current
    const content = chatContentRef.current

    if (!container || !content) return

    const updateStickiness = () => {
      const distanceFromBottom = container.scrollHeight - container.clientHeight - container.scrollTop
      shouldStickChatToBottomRef.current = distanceFromBottom <= 48
    }

    updateStickiness()

    const handleScroll = () => {
      updateStickiness()
    }

    container.addEventListener("scroll", handleScroll, { passive: true })

    if (typeof ResizeObserver === "undefined") {
      return () => {
        container.removeEventListener("scroll", handleScroll)
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      if (!shouldStickChatToBottomRef.current) return
      window.requestAnimationFrame(() => {
        scrollChatToBottom(shouldUseInstantChatScrollRef.current ? "auto" : "smooth")
        shouldUseInstantChatScrollRef.current = false
      })
    })

    resizeObserver.observe(content)

    return () => {
      container.removeEventListener("scroll", handleScroll)
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    shouldStickChatToBottomRef.current = true
    shouldUseInstantChatScrollRef.current = true
    window.requestAnimationFrame(() => {
      scrollChatToBottom("auto")
      shouldUseInstantChatScrollRef.current = false
    })
  }, [selectedRunId, selectedSessionId])

  return (
    <div className="relative h-dvh overflow-hidden bg-[#101010] text-white industrial-grid">
      <PatriotIntro visible={showIntro} />
      <PatriotHeader
        active="console"
        status={isSelectedRunLive ? "active" : "inactive"}
        statusSlot={headerStatusSlot}
        settingsSlot={
          <RunSettingsMenu
            settings={runSettings}
            workers={workers}
            onModelChange={(model) => setRunSettings((current) => ({ ...current, model }))}
            onProfileChange={(profile) => setRunSettings((current) => ({ ...current, profile }))}
            onWorkerChange={(workerId) => setRunSettings((current) => ({ ...current, workerId }))}
          />
        }
      />
      <main className="grid h-[calc(100dvh-52px)] min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,2fr)] overflow-hidden font-mono">
        <section className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] border-r border-white/10 bg-[#101010]">
          <div className="border-b border-white/10 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Operator / session</div>
                <div className="mt-2 text-sm uppercase tracking-[0.18em] text-white/88">
                  {currentSession?.title ?? "No active session"}
                </div>
              </div>
              <Button
                type="button"
                onClick={() => void startNewChat()}
                disabled={isCreatingSession}
                className="rounded-none border border-[#ec3844] bg-[#ec3844] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white hover:bg-[#d82d39]"
              >
                {isCreatingSession ? <LoaderCircle className="animate-spin" /> : <Plus />}
                New
              </Button>
            </div>

          </div>

          <div ref={chatScrollRef} className="min-h-0 overflow-y-auto px-4 py-3">
            {error ? (
              <div className="mb-3 border border-[#ec3844]/50 bg-[#1a0d11] px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-[#ffb3b8]">
                {error}
              </div>
            ) : null}

            {isLoading && !sessionState ? (
              <div className="flex h-full items-center justify-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45">
                <LoaderCircle className="animate-spin" size={16} />
                Loading session
              </div>
            ) : (
              <div ref={chatContentRef} className="space-y-4">
                {visibleMessages.length === 0 && !traceState.hasTrace ? (
                  <EmptyChatState copy="Ready for Deployment - Send a request to start Patriot" />
                ) : null}

                {visibleMessages.map((message) =>
                  message.role === "user" ? (
                    <OperatorMessageCard
                      key={message.id}
                      content={message.content}
                      at={message.createdAt}
                    />
                  ) : (
                    <AgentMessageCard
                      key={message.id}
                      messageId={message.id}
                      role={message.role}
                      content={message.content}
                      at={message.createdAt}
                    />
                  ),
                )}

                {shouldShowPendingLocalBanner ? (
                  <PendingLocalRunCard
                    compatibleOnlineFieldWorker={compatibleOnlineFieldWorker}
                    fieldWorkerNeedsUpgrade={fieldWorkerNeedsUpgrade}
                    onlineFieldWorker={onlineFieldWorker}
                    minimumPendingLocalVersion={minimumPendingLocalVersion}
                    hasFieldWorkerCapabilityMismatch={hasFieldWorkerCapabilityMismatch}
                    pendingLocalRecommendedClient={pendingLocalRecommendedClient}
                    pendingLocalBootstrap={pendingLocalBootstrap}
                    macOsDesktopSetupOption={macOsDesktopSetupOption}
                    macOsScriptSetupOption={macOsScriptSetupOption}
                    isSetupActive={isSetupActive}
                    isSetupReady={isSetupReady}
                    hasSetupFailed={hasSetupFailed}
                    copiedSetupCommand={copiedSetupCommand}
                    isResumingPendingLocalRun={isResumingPendingLocalRun}
                    onOpenSetupOption={openSetupOption}
                    onCopySetupCommand={copySetupCommand}
                  />
                ) : null}

                {traceState.hasTrace ? (
                  <TraceTerminalStream
                    runs={traceState.orderedSessionRuns}
                    selectedRunId={selectedRun?.id ?? null}
                    timelineEvents={traceState.visibleTimelineEvents}
                    activeRunId={selectedRun?.status === "running" ? selectedRun.id : null}
                  />
                ) : null}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 z-10 border-t border-white/10 bg-[#101010] px-4 py-4">
            {selectedRun ? (
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className={cn("border px-2 py-1 text-[10px] uppercase tracking-[0.18em]", runStatusTone(selectedRun.status))}>
                  {selectedRun.status} / {selectedRun.id.slice(0, 8)}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void stopRun()}
                  disabled={selectedRun.status !== "running" || isStopping}
                  className="rounded-none border-white/15 bg-transparent px-3 text-[10px] uppercase tracking-[0.18em] text-white hover:bg-white/5"
                >
                  {isStopping ? <LoaderCircle className="animate-spin" size={14} /> : <Square size={14} />}
                  Stop
                </Button>
              </div>
            ) : null}

            <div className="border border-white/10 bg-[#101010]">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    void submitMessage()
                  }
                }}
                placeholder="Run a safe recon check against 127.0.0.1 and summarize the environment."
                className="h-28 w-full resize-none bg-transparent px-3 py-3 text-[13px] leading-6 text-white outline-none placeholder:text-white/20"
              />
              <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">
                  Execute / {runSettings.profile} / Safety off
                </span>
                <Button
                  type="button"
                  onClick={() => void submitMessage()}
                  disabled={!draft.trim() || isSubmitting}
                  className="rounded-none border border-[#ec3844] bg-[#ec3844] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white hover:bg-[#d82d39]"
                >
                  {isSubmitting ? <LoaderCircle className="animate-spin" size={14} /> : <SendHorizontal size={14} />}
                  Send
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#101010]">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Report workspace</div>
                <div className="mt-2 text-sm uppercase tracking-[0.18em] text-white/88">
                  {selectedRun ? `Run ${selectedRun.id.slice(0, 8)}` : "Awaiting run"}
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
                        "flex min-w-[124px] items-center justify-between gap-3 border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors",
                        activeTab === tab.id
                          ? "border-[#ec3844] bg-[#190d11] text-white"
                          : "border-white/10 bg-[#101010] text-white/55 hover:text-white",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Icon size={14} />
                        {tab.label}
                      </span>
                      <span
                        className={cn(
                          "min-w-5 text-right text-[10px] tracking-[0.18em]",
                          activeTab === tab.id ? "text-[#ffb7bd]" : "text-white/36",
                        )}
                      >
                        {String(tabCounts[tab.id]).padStart(2, "0")}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${activeTab}-${rightRailStage}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                {activeTab === "summary" ? (
                  <SummaryPanel
                    sessionState={sessionState}
                    workers={workers}
                    runAssignments={runAssignments}
                    selectedRun={selectedRun}
                    rightRailStage={rightRailStage}
                    timelineEvents={traceState.visibleTimelineEvents}
                  />
                ) : null}
                {activeTab === "findings" ? (
                  <FindingsPanel findings={sessionState?.report.findings ?? []} />
                ) : null}
                {activeTab === "assets" ? (
                  <AssetsPanel assets={sessionState?.report.assets ?? []} />
                ) : null}
                {activeTab === "evidence" ? (
                  <EvidencePanel evidence={sessionState?.report.tool_evidence ?? []} />
                ) : null}
                {activeTab === "artifacts" ? (
                  <ArtifactsPanel artifacts={artifacts} />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  )
}

function OperatorMessageCard({
  content,
  at,
}: {
  content: string
  at?: string
}) {
  return (
    <article className="ml-auto max-w-[88%] px-1 py-1 text-right">
      <div className="mb-2 flex items-center justify-end gap-3 text-[10px] uppercase tracking-[0.18em] text-[#ff9da5]">
        {at ? <div className="text-white/38">{formatTime(at)}</div> : null}
        <div>Operator</div>
      </div>
      <div className="whitespace-pre-wrap text-[13px] leading-6 text-white">{content}</div>
    </article>
  )
}

function RunSettingsMenu({
  settings,
  workers,
  onModelChange,
  onProfileChange,
  onWorkerChange,
}: {
  settings: OperatorRunSettings
  workers: WorkerRecord[]
  onModelChange: (value: OperatorModel) => void
  onProfileChange: (value: OperatorRunProfile) => void
  onWorkerChange: (value: OperatorWorkerSelection) => void
}) {
  return (
    <details className="relative shrink-0">
      <summary className="flex list-none cursor-pointer appearance-none items-center justify-center border-0 bg-transparent p-0 text-white/45 outline-none transition-colors hover:text-white [&::marker]:hidden [&::-webkit-details-marker]:hidden">
        <Settings size={18} />
      </summary>

      <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-[min(280px,calc(100vw-24px))] max-w-[calc(100vw-24px)] origin-top-right border border-white/10 bg-[#101010] p-3 shadow-[0_18px_48px_rgba(0,0,0,0.45)]">
        <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-white/42">Run settings</div>

        <div className="space-y-3">
          <label className="block">
            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/38">Model</div>
            <select
              value={settings.model}
              onChange={(event) => onModelChange(event.target.value as OperatorModel)}
              className="w-full border border-white/10 bg-[#101010] px-3 py-2 text-[12px] text-white outline-none"
            >
              {modelOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#101010] text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/38">Profile</div>
            <select
              value={settings.profile}
              onChange={(event) => onProfileChange(event.target.value as OperatorRunProfile)}
              className="w-full border border-white/10 bg-[#101010] px-3 py-2 text-[12px] text-white outline-none"
            >
              {profileOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#101010] text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/38">Worker</div>
            <select
              value={settings.workerId}
              onChange={(event) => onWorkerChange(event.target.value)}
              className="w-full border border-white/10 bg-[#101010] px-3 py-2 text-[12px] text-white outline-none"
            >
              <option value="auto" className="bg-[#101010] text-white">
                Auto-select best worker
              </option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id} className="bg-[#101010] text-white">
                  {worker.name} / {worker.adapter?.kind ?? worker.type} / {worker.adapter?.health ?? worker.status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 border-t border-white/10 pt-3 text-[10px] uppercase tracking-[0.18em] text-white/38">
          {settings.model} / {settings.profile} / {settings.workerId === "auto" ? "auto worker" : settings.workerId}
        </div>
      </div>
    </details>
  )
}

function AgentMessageCard({
  messageId,
  role,
  content,
  at,
}: {
  messageId: string
  role: SessionMessageRecord["role"]
  content: string
  at?: string
}) {
  const lines = content.split("\n")
  const shouldAnimate = shouldAnimateConsoleEntryOnce(`message:${messageId}`, at)

  return (
    <article className="mr-12 max-w-[92%] px-1 py-1 font-mono">
      <div className="mb-2 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-white/38">
        <div>{role === "assistant" ? "Patriot" : "System"}</div>
        {at ? <div>{formatTime(at)}</div> : null}
      </div>
      <div>
        {lines.map((line, index) => {
          const displayLine = line || " "
          return (
            <TypewriterText
              key={`${role}-${messageId}-${index}`}
              text={displayLine}
              animate={shouldAnimate}
              delayMs={Math.min(index * 90, 420)}
              className="block max-w-full text-[12px] leading-6 text-white/78"
              caretClassName="bg-white/70"
            >
            </TypewriterText>
          )
        })}
      </div>
    </article>
  )
}

function PendingLocalRunCard({
  compatibleOnlineFieldWorker,
  fieldWorkerNeedsUpgrade,
  onlineFieldWorker,
  minimumPendingLocalVersion,
  hasFieldWorkerCapabilityMismatch,
  pendingLocalRecommendedClient,
  pendingLocalBootstrap,
  macOsDesktopSetupOption,
  macOsScriptSetupOption,
  isSetupActive,
  isSetupReady,
  hasSetupFailed,
  copiedSetupCommand,
  isResumingPendingLocalRun,
  onOpenSetupOption,
  onCopySetupCommand,
}: {
  compatibleOnlineFieldWorker: WorkerRecord | null
  fieldWorkerNeedsUpgrade: boolean
  onlineFieldWorker: WorkerRecord | null
  minimumPendingLocalVersion?: string
  hasFieldWorkerCapabilityMismatch: boolean
  pendingLocalRecommendedClient: string | null
  pendingLocalBootstrap: FieldSensorBootstrapInfo | null
  macOsDesktopSetupOption: FieldSensorBootstrapInfo["setup"][number] | null
  macOsScriptSetupOption: FieldSensorBootstrapInfo["setup"][number] | null
  isSetupActive: boolean
  isSetupReady: boolean
  hasSetupFailed: boolean
  copiedSetupCommand: boolean
  isResumingPendingLocalRun: boolean
  onOpenSetupOption: (option: FieldSensorBootstrapInfo["setup"][number]) => void
  onCopySetupCommand: (command: string) => Promise<void>
}) {
  const isReadyForContinue = isSetupReady && Boolean(compatibleOnlineFieldWorker)
  const setupStatus = isResumingPendingLocalRun
    ? { tone: "text-[#f5d36b]", icon: LoaderCircle, label: "Continuing request", spin: true }
    : isReadyForContinue
      ? { tone: "text-[#8ff0b3]", icon: CheckCircle2, label: "Setup complete", spin: false }
      : isSetupActive
        ? { tone: "text-[#f5d36b]", icon: LoaderCircle, label: "Setup in progress", spin: true }
        : hasSetupFailed
          ? { tone: "text-[#ffb3b8]", icon: AlertTriangle, label: "Setup expired, retry required", spin: false }
          : null
  const headline =
    isReadyForContinue
      ? "Field worker connected"
      : fieldWorkerNeedsUpgrade
        ? "Field worker update required"
        : hasFieldWorkerCapabilityMismatch
          ? "Field worker connected with limited capabilities"
          : "Waiting for field worker"
  const body =
    isReadyForContinue
      ? `${compatibleOnlineFieldWorker?.name ?? "Your field worker"} is online and ready to continue the pending local request.`
      : fieldWorkerNeedsUpgrade
        ? `${onlineFieldWorker?.name ?? "Your field worker"} is online, but it is running ${
            onlineFieldWorker?.adapter?.version ?? "an older version"
          }. Update it to ${minimumPendingLocalVersion} or later to continue local recon.`
        : hasFieldWorkerCapabilityMismatch
          ? `${onlineFieldWorker?.name ?? "A field worker"} is online, but it does not advertise the required capabilities for this request. ${
              pendingLocalRecommendedClient === "desktop"
                ? "Open Patriot Desktop for full local recon."
                : "Open a compatible native Patriot client."
            }`
          : "Patriot is waiting for a local field worker to come online for this request."

  return (
    <article className="mr-12 max-w-[92%] px-1 py-1 font-mono">
      <div className="mb-2 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-white/38">
        <div>Patriot</div>
        <div>Setup</div>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">{headline}</div>
          <div className="mt-1 text-[12px] leading-5 text-white/82">{body}</div>
          {fieldWorkerNeedsUpgrade && minimumPendingLocalVersion ? (
            <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-[#ffb3b8]">
              Minimum version: {minimumPendingLocalVersion}
              {onlineFieldWorker?.adapter?.version ? ` / Installed: ${onlineFieldWorker.adapter.version}` : ""}
            </div>
          ) : null}
          {setupStatus ? (
            <div className={cn("mt-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]", setupStatus.tone)}>
              <setupStatus.icon size={14} className={setupStatus.spin ? "animate-spin" : undefined} />
              {setupStatus.label}
            </div>
          ) : null}
          {!isSetupActive && !isReadyForContinue && pendingLocalBootstrap?.os === "macos" ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {macOsDesktopSetupOption ? (
                <div className="border border-white/10 bg-[#111111] p-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">Installer</div>
                  <div className="mt-1 text-[12px] text-white/88">{macOsDesktopSetupOption.label}</div>
                  <div className="mt-1 text-[11px] leading-5 text-white/52">
                    {setupOptionDescription(macOsDesktopSetupOption)}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenSetupOption(macOsDesktopSetupOption)}
                    className="mt-3 rounded-none border-white/15 bg-transparent px-3 text-[10px] uppercase tracking-[0.18em] text-white hover:bg-white/5"
                  >
                    {macOsDesktopSetupOption.installUrl ? "Open installer" : "Open desktop app"}
                  </Button>
                </div>
              ) : null}
              {macOsScriptSetupOption ? (
                <div className="border border-white/10 bg-[#111111] p-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">One-time script</div>
                  <div className="mt-1 text-[12px] text-white/88">{macOsScriptSetupOption.label}</div>
                  <div className="mt-1 text-[11px] leading-5 text-white/52">
                    {setupOptionDescription(macOsScriptSetupOption)}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {macOsScriptSetupOption.command ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void onCopySetupCommand(macOsScriptSetupOption.command!)}
                        className="rounded-none border-white/15 bg-transparent px-3 text-[10px] uppercase tracking-[0.18em] text-white hover:bg-white/5"
                      >
                        <Copy size={14} />
                        {copiedSetupCommand ? "Copied" : "Copy command"}
                      </Button>
                    ) : null}
                    {macOsScriptSetupOption.scriptUrl ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenSetupOption(macOsScriptSetupOption)}
                        className="rounded-none border-white/15 bg-transparent px-3 text-[10px] uppercase tracking-[0.18em] text-white hover:bg-white/5"
                      >
                        View script
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : !isSetupActive && !isReadyForContinue && pendingLocalBootstrap ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {pendingLocalBootstrap.setup.map((option) => (
                <Button
                  key={`${option.kind}-${option.label}`}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenSetupOption(option)}
                  className="rounded-none border-white/15 bg-transparent px-3 text-[10px] uppercase tracking-[0.18em] text-white hover:bg-white/5"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function TerminalCursor() {
  return (
    <motion.span
      className="ml-2 inline-block h-[12px] w-[7px] translate-y-[1px] bg-[#ec3844]"
      animate={{ opacity: [0.9, 0.3, 0.9] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    />
  )
}

function TraceTerminalStream({
  runs,
  selectedRunId,
  timelineEvents,
  activeRunId,
}: {
  runs: RunRecord[]
  selectedRunId: string | null
  timelineEvents: TimelineEvent[]
  activeRunId: string | null
}) {
  const activeToolSignatures = useMemo(() => {
    const settled = new Set<string>()
    const active = new Set<string>()

    for (let index = timelineEvents.length - 1; index >= 0; index -= 1) {
      const event = timelineEvents[index]
      if (!event || event.kind !== "tool") continue
      const signature = getTraceToolSignature(event)
      if (!signature) continue

      if (event.sourceEventType === "tool.result") {
        settled.add(signature)
        continue
      }

      if ((event.sourceEventType === "tool.intent" || event.sourceEventType === "tool.progress") && !settled.has(signature)) {
        active.add(signature)
      }
    }

    return active
  }, [timelineEvents])

  const runGroups = useMemo(() => {
    const groups: Array<{ run: RunRecord | null; events: TimelineEvent[] }> = []
    const eventsByRunId = new Map<string, TimelineEvent[]>()
    for (const event of timelineEvents) {
      const group = eventsByRunId.get(event.runId) ?? []
      group.push(event)
      eventsByRunId.set(event.runId, group)
    }

    const orderedKnownRuns = runs.toSorted((left, right) => left.createdAt.localeCompare(right.createdAt))
    const seenRunIds = new Set<string>()
    for (const run of orderedKnownRuns) {
      seenRunIds.add(run.id)
      groups.push({
        run,
        events: eventsByRunId.get(run.id) ?? [],
      })
    }

    for (const [runId, events] of eventsByRunId.entries()) {
      if (seenRunIds.has(runId)) continue
      groups.push({
        run: null,
        events,
      })
    }

    return groups.filter((group) => group.run !== null || group.events.length > 0)
  }, [runs, timelineEvents])

  return (
    <article className="mr-12 max-w-[92%] px-1 py-1 font-mono">
      <div className="mb-3 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-white/38">
        <div>Agent trace</div>
        {selectedRunId ? <div>Session trace / current {selectedRunId.slice(0, 8)}</div> : null}
      </div>

      {timelineEvents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[12px] leading-6 text-white/52"
        >
          Waiting for live trace events...
          {activeRunId ? <TerminalCursor /> : null}
        </motion.div>
      ) : (
        <AnimatePresence initial={false}>
          {runGroups.map((group, groupIndex) => {
            const groupRunId = group.run?.id ?? group.events[0]?.runId ?? `run-${groupIndex}`
            const isCurrentRun = groupRunId === selectedRunId
            const groupStatus = group.run?.status ?? "running"

            return (
              <motion.div
                key={groupRunId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, delay: Math.min(groupIndex * 0.03, 0.18) }}
                className="mb-5 border-l border-white/8 pl-3"
              >
                <div
                  className={cn(
                    "mb-3 text-[10px] uppercase tracking-[0.18em]",
                    isCurrentRun ? "text-white/72" : "text-white/34",
                  )}
                >
                  Run {groupRunId.slice(0, 8)} / {groupStatus}
                </div>

                {group.events.map((event, index) => {
                  const formatted = formatTraceEvent(event)
                  const isTool = event.kind === "tool"
                  const toolSignature = isTool ? getTraceToolSignature(event) : null
                  const isActiveTool =
                    toolSignature !== null &&
                    event.sourceEventType !== "tool.result" &&
                    activeToolSignatures.has(toolSignature)
                  const isLatest =
                    event.id === timelineEvents.at(-1)?.id && groupRunId === activeRunId
                  const shouldAnimate = shouldAnimateConsoleEntryOnce(`trace:${event.id}`, event.ts)

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, delay: Math.min(index * 0.02, 0.16) }}
                      className="mb-3"
                    >
                      <div className="flex items-start justify-between gap-3 text-[12px] leading-[1.5]">
                        <div className="min-w-0 flex-1 text-white/72">
                          {isActiveTool ? (
                            <TextShimmer
                              className="text-[12px]"
                              style={
                                {
                                  "--foreground": "rgb(255 255 255 / 0.9)",
                                  "--muted-foreground": "rgb(255 255 255 / 0.42)",
                                } as CSSProperties
                              }
                            >
                              {formatted.label}
                            </TextShimmer>
                          ) : (
                            <TypewriterText
                              text={formatted.label}
                              animate={shouldAnimate}
                              className="max-w-full text-[12px]"
                              caretClassName="bg-white/70"
                            />
                          )}
                          {isLatest ? <TerminalCursor /> : null}
                        </div>

                        <div className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-white/32">
                          {formatTime(event.ts)}
                        </div>
                      </div>

                      {formatted.facts.length > 0 ? (
                        <div className="mt-2 space-y-1 border-l border-white/8 pl-3 text-[11px] leading-5 text-white/58">
                          {formatted.facts.map((fact) => (
                            <TypewriterText
                              key={`${event.id}-${fact}`}
                              text={fact}
                              animate={shouldAnimate}
                              delayMs={90}
                              className="block max-w-full"
                              caretClassName="bg-white/60"
                            >
                            </TypewriterText>
                          ))}
                        </div>
                      ) : null}
                    </motion.div>
                  )
                })}
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}
    </article>
  )
}

function EmptyChatState({ copy }: { copy: string }) {
  return (
    <div className="mr-12 max-w-[92%] px-1 py-2 font-mono text-[12px] leading-6 text-white/55">
      <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/38">
        <AlertTriangle size={14} />
        Waiting on activity
      </div>
      {copy}
    </div>
  )
}

function SummaryPanel({
  sessionState,
  workers,
  runAssignments,
  selectedRun,
  rightRailStage,
  timelineEvents,
}: {
  sessionState: SessionStateResponse | null
  workers: WorkerRecord[]
  runAssignments: RunAssignmentRecord[]
  selectedRun: RunRecord | null
  rightRailStage: RightRailStage
  timelineEvents: TimelineEvent[]
}) {
  const orderedAssignments = useMemo(
    () =>
      runAssignments.toSorted((left, right) => {
        const leftAnchor = left.startedAt ?? left.createdAt
        const rightAnchor = right.startedAt ?? right.createdAt
        if (leftAnchor !== rightAnchor) return leftAnchor.localeCompare(rightAnchor)
        return left.createdAt.localeCompare(right.createdAt)
      }),
    [runAssignments],
  )
  const activePhaseAssignmentId = useMemo(() => {
    if (rightRailStage !== "during") return null
    return (
      orderedAssignments.find((assignment) => assignment.status === "running")?.id ??
      orderedAssignments.find((assignment) => assignment.status === "queued")?.id ??
      null
    )
  }, [orderedAssignments, rightRailStage])
  const activeWorkerIds = useMemo(() => {
    if (rightRailStage !== "during") return new Set<string>()
    return new Set(
      runAssignments
        .filter((assignment) => assignment.status === "queued" || assignment.status === "running")
        .map((assignment) => assignment.workerId),
    )
  }, [rightRailStage, runAssignments])
  const connectedSessionWorkers = useMemo(() => {
    const workerIds = new Set<string>()

    for (const run of sessionState?.runs ?? EMPTY_RUNS) {
      if (run.workerId) workerIds.add(run.workerId)
    }

    for (const assignment of runAssignments) {
      if (assignment.workerId) workerIds.add(assignment.workerId)
    }

    for (const entry of sessionState?.report.tool_evidence ?? []) {
      if (entry.source_worker_id) workerIds.add(entry.source_worker_id)
    }

    const preferredFieldWorkerId =
      sessionState?.session.metadata &&
      typeof sessionState.session.metadata.field_sensor_worker_id === "string"
        ? sessionState.session.metadata.field_sensor_worker_id
        : null
    if (preferredFieldWorkerId) workerIds.add(preferredFieldWorkerId)

    return workers.filter((worker) => workerIds.has(worker.id))
  }, [runAssignments, sessionState, workers])
  const narrative = sessionState?.report.narrative.summary?.trim() ?? ""
  const hasNarrative = narrative.length > 0
  const shouldShowNarrative =
    (selectedRun?.status === "completed" || selectedRun?.status === "failed") && hasNarrative
  const showAssessment = hasAssessmentEvidence(sessionState?.report)
  const assessment = showAssessment ? sessionState?.report.assessment : undefined
  const reconDeliverables =
    showAssessment && hasReconDeliverablesContent(sessionState?.report.recon_deliverables)
      ? sessionState?.report.recon_deliverables
      : undefined
  const nextActionTodos = useMemo<NextActionTodo[]>(() => {
    if (orderedAssignments.length > 0) {
      return orderedAssignments.slice(0, 10).map((assignment) => {
        const worker = workers.find((item) => item.id === assignment.workerId)
        return {
          id: assignment.id,
          label: formatAssignmentTodoLabel(assignment),
          status: mapAssignmentStatusToTodoStatus(assignment.status),
          meta: formatAssignmentTodoMeta(assignment, worker?.name),
        }
      })
    }

    const requiredActionSnapshot = latestSupervisorRequiredActions(timelineEvents, selectedRun?.id ?? null)
    if (requiredActionSnapshot) {
      const fallbackStatus: TodoStatus =
        selectedRun?.status === "failed" || selectedRun?.status === "stopped"
          ? "error"
          : requiredActionSnapshot.verdict === "stop" && selectedRun?.status === "completed"
            ? "success"
            : "scheduled"

      return requiredActionSnapshot.requiredActions.slice(0, 10).map((action, index) => ({
        id: `required-action-${selectedRun?.id ?? "session"}-${index}`,
        label: action,
        status: fallbackStatus,
        meta: "Supervisor-required follow-up",
      }))
    }

    return (reconDeliverables?.next_actions ?? []).slice(0, 10).map((item) => ({
      id: `recommended-next-action-${item.value}`,
      label: item.value,
      status: "scheduled",
      meta:
        item.notes ??
        (item.confidence === "confirmed" ? "Derived from confirmed evidence." : "Suggested from the current recon assessment."),
    }))
  }, [orderedAssignments, reconDeliverables?.next_actions, selectedRun?.id, selectedRun?.status, timelineEvents, workers])

  return (
    <div className="flex flex-col gap-6">
      <motion.section layout className="order-1 space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Execution phases</div>
        {orderedAssignments.length > 0 ? (
          <div className="space-y-2">
            {orderedAssignments.map((assignment, index) => {
              const worker = workers.find((item) => item.id === assignment.workerId)
              return (
                <motion.div
                  key={assignment.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start justify-between gap-3 border border-white/10 px-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-white/82">
                      <span className="text-white/35">{String(index + 1).padStart(2, "0")}</span>
                      {assignment.id === activePhaseAssignmentId ? (
                        <TextShimmer
                          className="text-[12px] uppercase tracking-[0.16em]"
                          style={
                            {
                              "--foreground": "rgb(255 255 255 / 0.88)",
                              "--muted-foreground": "rgb(255 255 255 / 0.42)",
                            } as CSSProperties
                          }
                        >
                          {assignment.kind} / {assignment.capabilityFamily}
                        </TextShimmer>
                      ) : (
                        <span>{assignment.kind} / {assignment.capabilityFamily}</span>
                      )}
                    </div>
                    <div className="mt-1 text-[12px] text-white/58">
                      {worker?.name ?? assignment.workerId}
                      {assignment.adapterKind ? ` / ${assignment.adapterKind}` : ""}
                    </div>
                    {assignment.notes?.length ? (
                      <div className="mt-2 space-y-1 text-[11px] leading-5 text-white/48">
                        {assignment.notes.map((note) => (
                          <div key={`${assignment.id}-${note}`}>- {note}</div>
                        ))}
                      </div>
                    ) : null}
                    {assignment.targetScope?.length ? (
                      <div className="mt-2 text-[10px] uppercase tracking-[0.16em] text-white/35">
                        Targets: {assignment.targetScope.join(", ")}
                      </div>
                    ) : null}
                    {assignment.error ? (
                      <div className="mt-2 text-[11px] leading-5 text-[#ffadb3]">Reason: {assignment.error}</div>
                    ) : null}
                  </div>
                  <div className={cn("border px-2 py-1 text-[10px] uppercase tracking-[0.16em]", runStatusTone(
                    assignment.status === "completed"
                      ? "completed"
                      : assignment.status === "failed"
                        ? "failed"
                        : assignment.status === "running"
                          ? "running"
                          : assignment.status === "skipped"
                            ? "stopped"
                            : undefined,
                  ))}>
                    {assignment.status}
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <EmptyPanel copy="Execution phases will populate in the order the run schedules them." />
        )}
      </motion.section>

      <AnimatePresence initial={false} mode="wait">
        {rightRailStage === "after" && shouldShowNarrative ? (
          <motion.section
            key="narrative-ready"
            layout
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 space-y-3"
          >
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
              <Play size={14} />
              Summary narrative
            </div>
            <div className="whitespace-pre-wrap text-[13px] leading-7 text-white/82">{narrative}</div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {assessment ? (
        <motion.section layout className="order-3 space-y-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Assessment</div>
          <div className="grid gap-2 md:grid-cols-2">
            {Object.entries(assessment.minimum_coverage).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between border border-white/10 px-3 py-2 text-[12px] text-white/72">
                <span className="uppercase tracking-[0.16em] text-white/40">{coverageChecklistLabel(key)}</span>
                <span className={value ? "text-[#9fe8b0]" : "text-[#ffadb3]"}>{value ? "yes" : "no"}</span>
              </div>
            ))}
          </div>
          {sessionState?.report.preflight ? (
            <div className="border border-white/10 bg-[#101010] px-3 py-3 text-[12px] leading-6 text-white/72">
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/38">Recon preflight</div>
              <div className="mt-2">{sessionState.report.preflight.summary}</div>
              {sessionState.report.coverage_debt.length > 0 ? (
                <div className="mt-2 text-[11px] leading-5 text-white/48">
                  Coverage debt: {sessionState.report.coverage_debt.join(", ")}
                </div>
              ) : null}
            </div>
          ) : null}
        </motion.section>
      ) : null}

      {reconDeliverables ? (
        <motion.section layout className="order-4 space-y-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Recon Deliverables</div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { label: "Domains", items: reconDeliverables.domains ?? [] },
              { label: "Subdomains", items: reconDeliverables.subdomains ?? [] },
              { label: "Entry points", items: reconDeliverables.entry_points ?? [] },
              { label: "Login surfaces", items: reconDeliverables.login_surfaces ?? [] },
              { label: "Admin surfaces", items: reconDeliverables.admin_surfaces ?? [] },
              { label: "API endpoints", items: reconDeliverables.api_endpoints ?? [] },
              { label: "JavaScript routes", items: reconDeliverables.javascript_routes ?? [] },
              { label: "Integrations", items: reconDeliverables.third_party_integrations ?? [] },
              { label: "Storage exposure", items: reconDeliverables.storage_exposures ?? [] },
              { label: "Cloud platform hints", items: reconDeliverables.cloud_platform_hints ?? [] },
              { label: "Kubernetes hints", items: reconDeliverables.kubernetes_hints ?? [] },
              { label: "Cloud boundaries", items: reconDeliverables.cloud_boundaries ?? [] },
              { label: "Trust boundaries", items: reconDeliverables.trust_boundaries ?? [] },
              ...(reconDeliverables.surface_clusters ?? []).map((cluster) => ({ label: cluster.label, items: cluster.items ?? [] })),
            ].map(({ label, items }) =>
              items.length > 0 ? (
                <div key={label} className="border border-white/10 bg-[#101010] p-3">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</div>
                  <div className="space-y-2 text-[12px] leading-6 text-white/68">
                    {items.slice(0, 6).map((item) => (
                      <div key={`${label}-${item.value}`} className="flex items-start justify-between gap-3">
                        <span className="min-w-0 break-all">{item.value}</span>
                        <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-white/38">{item.confidence}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </motion.section>
      ) : null}

      {nextActionTodos.length > 0 ? (
        <motion.section layout className={cn("space-y-3", rightRailStage === "after" ? "order-5" : "order-2")}>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Next actions</div>
          <div className="space-y-2">
            {nextActionTodos.map((todo) => (
              <div key={todo.id} className="flex items-center justify-between gap-3 border border-white/10 px-3 py-2 text-[12px] text-white/72">
                <div className="flex min-w-0 items-center gap-3">
                  <TodoMark status={todo.status} />
                  <span className="min-w-0 text-[12px] leading-6 text-white/72">{todo.label}</span>
                </div>
                <div className={cn("shrink-0 text-[12px]", todoStatusTone(todo.status))}>{todo.status}</div>
              </div>
            ))}
          </div>
        </motion.section>
      ) : null}

      <motion.section layout className="order-6 space-y-3 pb-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Connected Workers</div>
        {connectedSessionWorkers.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {connectedSessionWorkers.map((worker) => (
              <motion.article key={worker.id} layout className="border border-white/10 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[12px] uppercase tracking-[0.16em] text-white/82">{worker.name}</div>
                    <div className="mt-1 text-[11px] text-white/48">
                      {worker.adapter?.kind ?? worker.type} / {worker.platform}
                    </div>
                  </div>
                  <ActivityStatusBadge
                    status={activeWorkerIds.has(worker.id) ? "active" : "inactive"}
                    className="shrink-0"
                  />
                </div>
                {worker.adapter?.diagnostics?.length ? (
                  <div className="mt-3 text-[11px] leading-5 text-white/52">
                    {worker.adapter.diagnostics.slice(0, 2).join(" / ")}
                  </div>
                ) : null}
                {worker.adapter?.recommendedFixes?.length &&
                worker.adapter?.health !== "blocked" ? (
                  <div className="mt-2 text-[11px] leading-5 text-white/38">
                    Fix: {worker.adapter.recommendedFixes[0]}
                  </div>
                ) : null}
                <div className={cn("mt-3 inline-flex border px-2 py-1 text-[10px] uppercase tracking-[0.16em]", workerHealthTone(worker.adapter?.health))}>
                  {workerHealthLabel(worker.adapter?.health)}
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <EmptyPanel copy="Only workers that actually participated in this session will appear here." />
        )}
      </motion.section>
    </div>
  )
}

function FindingsPanel({ findings }: { findings: FindingRecord[] }) {
  if (findings.length === 0) {
    return <EmptyPanel copy="No structured findings have been recorded yet." />
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
          {finding.description ? (
            <p className="mt-4 text-[13px] leading-6 text-white/72">{finding.description}</p>
          ) : null}
          {finding.remediation ? (
            <div className="mt-4 border border-white/10 bg-[#101010] p-3 text-[12px] leading-6 text-white/68">
              <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/35">Remediation</div>
              {finding.remediation}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}

function AssetsPanel({ assets }: { assets: AssetRecord[] }) {
  if (assets.length === 0) {
    return <EmptyPanel copy="Assets will appear once the selected session has collected evidence." />
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

function EvidencePanel({ evidence }: { evidence: ReducedToolEvidence[] }) {
  if (evidence.length === 0) {
    return <EmptyPanel copy="Tool evidence will appear after the first completed run." />
  }

  return (
    <div className="space-y-3">
      {evidence.map((entry) => (
        <article key={`${entry.tool}-${entry.target ?? "none"}`} className="border border-white/10 bg-[#101010] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm uppercase tracking-[0.12em] text-white/88">{entry.tool}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">{entry.status}</div>
          </div>
          {entry.target ? (
            <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/35">{entry.target}</div>
          ) : null}
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
    return <EmptyPanel copy="Run artifacts will appear here after report generation." />
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

function EmptyPanel({ copy }: { copy: string }) {
  return (
    <div className="border border-dashed border-white/10 bg-[#101010] p-5 text-[12px] leading-6 text-white/55">
      <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/45">
        <AlertTriangle size={14} />
        Waiting on data
      </div>
      {copy}
    </div>
  )
}
