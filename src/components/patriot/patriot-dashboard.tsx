import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react"
import {
  AlertTriangle,
  Boxes,
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

import { PatriotHeader } from "@/components/patriot/patriot-header"
import { PatriotIntro } from "@/components/patriot/patriot-intro"
import { Button } from "@/components/ui/button"
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

const tabs: Array<{ id: ViewTab; label: string; icon: typeof FileStack }> = [
  { id: "summary", label: "Summary", icon: FileStack },
  { id: "findings", label: "Findings", icon: ShieldAlert },
  { id: "assets", label: "Assets", icon: Boxes },
  { id: "evidence", label: "Evidence", icon: FileCode2 },
  { id: "artifacts", label: "Artifacts", icon: FolderArchive },
]

type OperatorRunProfile = "recon" | "redteam"
type OperatorModel = "claude-sonnet-4-6" | "claude-opus-4-6"
type OperatorWorkerSelection = "auto" | string

type OperatorRunSettings = {
  model: OperatorModel
  profile: OperatorRunProfile
  workerId: OperatorWorkerSelection
}

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

function compactToolName(tool: string) {
  return tool.split("__").filter(Boolean).at(-1) ?? tool
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

export function PatriotDashboard() {
  const [showIntro, setShowIntro] = useState(true)
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [workers, setWorkers] = useState<WorkerRecord[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const deferredSessionId = useDeferredValue(selectedSessionId)
  const [sessionState, setSessionState] = useState<SessionStateResponse | null>(null)
  const [messages, setMessages] = useState<SessionMessageRecord[]>([])
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [artifacts, setArtifacts] = useState<ArtifactRecord[]>([])
  const [runAssignments, setRunAssignments] = useState<RunAssignmentRecord[]>([])
  const [draft, setDraft] = useState("")
  const [activeTab, setActiveTab] = useState<ViewTab>("summary")
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [isResumingPendingLocalRun, setIsResumingPendingLocalRun] = useState(false)
  const [copiedSetupCommand, setCopiedSetupCommand] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [runSettings, setRunSettings] = useState<OperatorRunSettings>({
    model: "claude-sonnet-4-6",
    profile: "recon",
    workerId: "auto",
  })

  const currentSession = sessionState?.session ?? sessions.find((item) => item.id === selectedSessionId) ?? null
  const runs = sessionState?.runs ?? []
  const selectedRun =
    runs.find((run) => run.id === selectedRunId) ??
    runs.find((run) => run.id === currentSession?.currentRunId) ??
    runs[0] ??
    null
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

  const syncSessionsList = async () => {
    const response = await patriotApi.listSessions()
    startTransition(() => {
      setSessions(response.sessions)
      if (!selectedSessionId && response.sessions.length > 0) setSelectedSessionId(response.sessions[0]!.id)
    })
  }

  const loadSessionState = async (sessionId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const [stateResponse, messagesResponse] = await Promise.all([
        patriotApi.getSessionState(sessionId),
        patriotApi.getSessionMessages(sessionId),
      ])

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
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSessions = useEffectEvent(async () => {
    await syncSessionsList()
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
    const target = option.installUrl ?? option.deepLink ?? option.scriptUrl
    if (!target) return
    window.open(target, option.deepLink && !option.installUrl ? "_self" : "_blank", "noopener,noreferrer")
  }

  const copySetupCommand = async (command: string) => {
    try {
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
    const timer = window.setTimeout(() => setShowIntro(false), 3600)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    void refreshSessions()
  }, [])

  useEffect(() => {
    void refreshWorkers()
  }, [])

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
    if (!selectedRunId) {
      setTimelineEvents([])
      setArtifacts([])
      setRunAssignments([])
      return
    }

    let closed = false
    setTimelineEvents([])
    void refreshRunArtifacts(selectedRunId)
    void refreshRunAssignments(selectedRunId)

    const source = createTimelineEventSource(selectedRunId)
    source.onmessage = (event) => {
      if (closed) return
      try {
        const payload = JSON.parse(event.data) as TimelineEvent
        startTransition(() => setTimelineEvents((current) => mergeTimelineEvents(current, [payload])))
        if (payload.kind === "status" && ["complete", "failed"].includes(payload.status ?? "")) {
          const activeSessionId = deferredSessionId ?? selectedSessionId
          if (activeSessionId) void refreshSession(activeSessionId)
          void refreshRunArtifacts(selectedRunId)
          void refreshRunAssignments(selectedRunId)
        }
      } catch {
        // Ignore malformed timeline frames.
      }
    }
    source.onerror = () => source.close()

    return () => {
      closed = true
      source.close()
    }
  }, [deferredSessionId, selectedRunId, selectedSessionId])

  const createSession = async () => {
    setIsCreatingSession(true)
    setError(null)
    try {
      const session = await patriotApi.createSession({
        title: `Session ${new Date().toLocaleDateString()}`,
        createdBy: "operator",
      })
      await syncSessionsList()
      startTransition(() => {
        setSelectedSessionId(session.id)
        setMessages([])
        setSessionState(null)
        setSelectedRunId(null)
        setDraft("")
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsCreatingSession(false)
    }
  }

  const ensureSession = async () => {
    if (selectedSessionId) return selectedSessionId

    const session = await patriotApi.createSession({
      title: `Session ${new Date().toLocaleDateString()}`,
      createdBy: "operator",
    })

    await syncSessionsList()
    startTransition(() => {
      setSelectedSessionId(session.id)
    })
    return session.id
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
          setTimelineEvents([])
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

  const continuePendingLocalRun = async () => {
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
        setTimelineEvents([])
      })
      await loadSessionState(selectedSessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsResumingPendingLocalRun(false)
    }
  }

  const traceState = useMemo(() => {
    const visibleTimelineEvents = timelineEvents.filter((event) => event.kind !== "artifact")
    return {
      visibleTimelineEvents,
      hasTrace: Boolean(selectedRun) || visibleTimelineEvents.length > 0,
    }
  }, [selectedRun, timelineEvents])

  return (
    <div className="relative h-dvh overflow-hidden bg-[#101010] text-white industrial-grid">
      <PatriotIntro visible={showIntro} />
      <PatriotHeader
        active="console"
        status={selectedRun?.status === "running" ? "active" : "inactive"}
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
                onClick={() => void createSession()}
                disabled={isCreatingSession}
                className="rounded-none border border-[#ec3844] bg-[#ec3844] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white hover:bg-[#d82d39]"
              >
                {isCreatingSession ? <LoaderCircle className="animate-spin" /> : <Plus />}
                New
              </Button>
            </div>

          </div>

          <div className="min-h-0 overflow-y-auto px-4 py-3">
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
              <div className="space-y-4">
                {messages.length === 0 && !traceState.hasTrace ? (
                  <EmptyChatState copy="Create a session and send a recon prompt to start collecting trace data and reports." />
                ) : null}

                {messages.map((message) =>
                  message.role === "user" ? (
                    <OperatorMessageCard
                      key={message.id}
                      content={message.content}
                      at={message.createdAt}
                    />
                  ) : (
                    <AgentMessageCard
                      key={message.id}
                      role={message.role}
                      content={message.content}
                      at={message.createdAt}
                    />
                  ),
                )}

                {traceState.hasTrace ? (
                  <TraceTerminalStream
                    run={selectedRun}
                    timelineEvents={traceState.visibleTimelineEvents}
                    isActive={selectedRun?.status === "running"}
                  />
                ) : null}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 z-10 border-t border-white/10 bg-[#101010] px-4 py-4">
            {shouldShowPendingLocalBanner ? (
              <div className="mb-3 border border-white/10 bg-white/[0.03] px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                      {pendingLocalResumeRequired && compatibleOnlineFieldWorker
                        ? "Field worker connected"
                        : fieldWorkerNeedsUpgrade
                          ? "Field worker update required"
                        : hasFieldWorkerCapabilityMismatch
                          ? "Field worker connected with limited capabilities"
                          : "Waiting for field worker"}
                    </div>
                    <div className="mt-1 text-[12px] leading-5 text-white/82">
                      {pendingLocalResumeRequired && compatibleOnlineFieldWorker
                        ? `${compatibleOnlineFieldWorker.name} is online and ready to continue the pending local request.`
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
                          : "Patriot is waiting for a local field worker to come online for this request."}
                    </div>
                    {pendingLocalRequiredCapabilities.length > 0 ? (
                      <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/38">
                        Requires: {pendingLocalRequiredCapabilities.join(", ")}
                      </div>
                    ) : null}
                    {fieldWorkerNeedsUpgrade && minimumPendingLocalVersion ? (
                      <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-[#ffb3b8]">
                        Minimum version: {minimumPendingLocalVersion}
                        {onlineFieldWorker?.adapter?.version ? ` / Installed: ${onlineFieldWorker.adapter.version}` : ""}
                      </div>
                    ) : null}
                    {pendingLocalBootstrap?.os === "macos" ? (
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
                              onClick={() => openSetupOption(macOsDesktopSetupOption)}
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
                            {macOsScriptSetupOption.command ? (
                              <pre className="mt-3 overflow-x-auto border border-white/10 bg-black px-3 py-2 text-[11px] leading-5 text-white/76">
                                <code>{macOsScriptSetupOption.command}</code>
                              </pre>
                            ) : null}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {macOsScriptSetupOption.command ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void copySetupCommand(macOsScriptSetupOption.command!)}
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
                                  onClick={() => openSetupOption(macOsScriptSetupOption)}
                                  className="rounded-none border-white/15 bg-transparent px-3 text-[10px] uppercase tracking-[0.18em] text-white hover:bg-white/5"
                                >
                                  View script
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : pendingLocalBootstrap ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {pendingLocalBootstrap.setup.map((option) => (
                          <Button
                            key={`${option.kind}-${option.label}`}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openSetupOption(option)}
                            className="rounded-none border-white/15 bg-transparent px-3 text-[10px] uppercase tracking-[0.18em] text-white hover:bg-white/5"
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-2 text-[11px] leading-5 text-white/50">
                      {pendingLocalPrompt}
                    </div>
                  </div>
                  {pendingLocalResumeRequired && compatibleOnlineFieldWorker ? (
                    <Button
                      type="button"
                      onClick={() => void continuePendingLocalRun()}
                      disabled={isResumingPendingLocalRun}
                      className="rounded-none border border-[#ec3844] bg-[#ec3844] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white hover:bg-[#d82d39]"
                    >
                      {isResumingPendingLocalRun ? <LoaderCircle className="animate-spin" size={14} /> : <Play size={14} />}
                      Continue
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

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

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {activeTab === "summary" ? (
              <SummaryPanel
                sessionState={sessionState}
                runCount={runs.length}
                workers={workers}
                runAssignments={runAssignments}
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
  role,
  content,
  at,
}: {
  role: SessionMessageRecord["role"]
  content: string
  at?: string
}) {
  const lines = content.split("\n")

  return (
    <article className="mr-12 max-w-[92%] px-1 py-1 font-mono">
      <div className="mb-2 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-white/38">
        <div>{role === "assistant" ? "Patriot" : "System"}</div>
        {at ? <div>{formatTime(at)}</div> : null}
      </div>
      <AnimatePresence initial={false}>
        {lines.map((line, index) => (
          <motion.div
            key={`${role}-${at ?? "none"}-${index}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.18) }}
            className="whitespace-pre-wrap text-[12px] leading-6 text-white/78"
          >
            {line || " "}
          </motion.div>
        ))}
      </AnimatePresence>
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
  run,
  timelineEvents,
  isActive,
}: {
  run: RunRecord | null
  timelineEvents: TimelineEvent[]
  isActive: boolean
}) {
  return (
    <article className="mr-12 max-w-[92%] px-1 py-1 font-mono">
      <div className="mb-3 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-white/38">
        <div>Agent trace</div>
        {run ? <div>{run.id.slice(0, 8)} / {run.status}</div> : null}
      </div>

      {timelineEvents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[12px] leading-6 text-white/52"
        >
          Waiting for live trace events...
          {isActive ? <TerminalCursor /> : null}
        </motion.div>
      ) : (
        <AnimatePresence initial={false}>
          {timelineEvents.map((event, index) => {
            const formatted = formatTraceEvent(event)
            const isTool = event.kind === "tool"
            const isLatest = event.id === timelineEvents.at(-1)?.id

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
                  <div className={cn("min-w-0 flex-1 text-white/72", isTool && "text-[#ec3844]")}>
                    <span>{formatted.label}</span>
                    {isActive && isLatest ? <TerminalCursor /> : null}
                  </div>

                  <div className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-white/32">
                    {formatTime(event.ts)}
                  </div>
                </div>

                {formatted.facts.length > 0 ? (
                  <div className="mt-2 space-y-1 border-l border-white/8 pl-3 text-[11px] leading-5 text-white/58">
                    {formatted.facts.map((fact) => (
                      <motion.div
                        key={`${event.id}-${fact}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16 }}
                      >
                        {fact}
                      </motion.div>
                    ))}
                  </div>
                ) : null}
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
  runCount,
  workers,
  runAssignments,
}: {
  sessionState: SessionStateResponse | null
  runCount: number
  workers: WorkerRecord[]
  runAssignments: RunAssignmentRecord[]
}) {
  if (!sessionState) {
    return <EmptyPanel copy="Session summary will appear after the first run is linked to a session." />
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Runs" value={String(runCount).padStart(2, "0")} />
        <MetricCard label="Findings" value={String(sessionState.report.findings.length).padStart(2, "0")} />
        <MetricCard label="Assets" value={String(sessionState.report.assets.length).padStart(2, "0")} />
      </div>

      {runAssignments.length > 0 ? (
        <div className="border border-white/10 bg-[#101010] p-4">
          <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-white/45">Execution phases</div>
          <div className="space-y-2">
            {runAssignments.map((assignment) => {
              const worker = workers.find((item) => item.id === assignment.workerId)
              return (
                <div key={assignment.id} className="flex items-start justify-between gap-3 border border-white/10 px-3 py-3">
                  <div className="min-w-0">
                    <div className="text-[12px] uppercase tracking-[0.16em] text-white/82">
                      {assignment.kind} / {assignment.capabilityFamily}
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
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="border border-white/10 bg-[#101010] p-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
          <Play size={14} />
          Reduced narrative
        </div>
        <div className="whitespace-pre-wrap text-[13px] leading-7 text-white/82">
          {sessionState.report.narrative.summary}
        </div>
      </div>

      <div className="border border-white/10 bg-[#101010] p-4">
        <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-white/45">Worker fleet</div>
        <div className="grid gap-3 md:grid-cols-2">
          {workers.map((worker) => (
            <article key={worker.id} className="border border-white/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[12px] uppercase tracking-[0.16em] text-white/82">{worker.name}</div>
                  <div className="mt-1 text-[11px] text-white/48">
                    {worker.adapter?.kind ?? worker.type} / {worker.platform}
                  </div>
                </div>
                <div className={cn("border px-2 py-1 text-[10px] uppercase tracking-[0.16em]", workerHealthTone(worker.adapter?.health))}>
                  {worker.adapter?.health ?? worker.status}
                </div>
              </div>
              {worker.adapter?.diagnostics?.length ? (
                <div className="mt-3 text-[11px] leading-5 text-white/52">
                  {worker.adapter.diagnostics.slice(0, 2).join(" / ")}
                </div>
              ) : null}
              {worker.adapter?.recommendedFixes?.length ? (
                <div className="mt-2 text-[11px] leading-5 text-white/38">
                  Fix: {worker.adapter.recommendedFixes[0]}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
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

function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="border border-white/10 bg-[#101010] p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</div>
      <div className="mt-3 text-sm uppercase tracking-[0.12em] text-white/88">{value}</div>
      {detail ? <div className="mt-3 text-[12px] leading-6 text-white/58">{detail}</div> : null}
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
