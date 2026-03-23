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
  FileCode2,
  FileStack,
  FolderArchive,
  LoaderCircle,
  Play,
  Plus,
  SendHorizontal,
  ShieldAlert,
  Square,
} from "lucide-react"

import { PatriotHeader } from "@/components/patriot/patriot-header"
import { PatriotIntro } from "@/components/patriot/patriot-intro"
import {
  Steps,
  StepsContent,
  StepsItem,
  StepsTrigger,
} from "@/components/prompt-kit/steps"
import { TextShimmer } from "@/components/prompt-kit/text-shimmer"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  createTimelineEventSource,
  patriotApi,
  type ArtifactRecord,
  type AssetRecord,
  type FindingRecord,
  type ReducedToolEvidence,
  type RunRecord,
  type SessionMessageRecord,
  type SessionRecord,
  type SessionStateResponse,
  type TimelineEvent,
} from "@/lib/patriot-api"

type ViewTab = "summary" | "findings" | "assets" | "evidence" | "artifacts"

const tabs: Array<{ id: ViewTab; label: string; icon: typeof FileStack }> = [
  { id: "summary", label: "Summary", icon: FileStack },
  { id: "findings", label: "Findings", icon: ShieldAlert },
  { id: "assets", label: "Assets", icon: Boxes },
  { id: "evidence", label: "Evidence", icon: FileCode2 },
  { id: "artifacts", label: "Artifacts", icon: FolderArchive },
]

function mergeTimelineEvents(current: TimelineEvent[], incoming: TimelineEvent[]) {
  const map = new Map(current.map((item) => [item.id, item]))
  for (const item of incoming) map.set(item.id, item)
  return [...map.values()].sort((a, b) => a.ts.localeCompare(b.ts))
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

function timelineTone(status?: TimelineEvent["status"]) {
  switch (status) {
    case "running":
      return "border-[#ec3844]/25 bg-[#120d0f]"
    case "failed":
      return "border-[#ec3844]/45 bg-[#1b0f13]"
    case "warning":
      return "border-white/12 bg-[#12161b]"
    default:
      return "border-white/8 bg-[#101010]"
  }
}

function compactToolName(tool: string) {
  return tool.split("__").filter(Boolean).at(-1) ?? tool
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
    const toolName = compactToolName(String(eventData?.tool ?? event.title.replace(/^Tool (started|finished):\s*/i, "")))
    const payload = event.sourceEventType === "tool.result" ? getToolResultPayload(event) : null
    const target = getToolTarget(event, payload)
    const label = `${event.sourceEventType === "tool.intent" ? "Started" : "Finished"}: ${toolName}${target ? ` => ${target}` : ""}`
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
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const deferredSessionId = useDeferredValue(selectedSessionId)
  const [sessionState, setSessionState] = useState<SessionStateResponse | null>(null)
  const [messages, setMessages] = useState<SessionMessageRecord[]>([])
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [artifacts, setArtifacts] = useState<ArtifactRecord[]>([])
  const [draft, setDraft] = useState("")
  const [activeTab, setActiveTab] = useState<ViewTab>("summary")
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentSession = sessionState?.session ?? sessions.find((item) => item.id === selectedSessionId) ?? null
  const runs = sessionState?.runs ?? []
  const selectedRun =
    runs.find((run) => run.id === selectedRunId) ??
    runs.find((run) => run.id === currentSession?.currentRunId) ??
    runs[0] ??
    null

  const refreshSessions = useEffectEvent(async () => {
    const response = await patriotApi.listSessions()
    startTransition(() => {
      setSessions(response.sessions)
      if (!selectedSessionId && response.sessions.length > 0) setSelectedSessionId(response.sessions[0]!.id)
    })
  })

  const refreshSession = useEffectEvent(async (sessionId: string) => {
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
  })

  const refreshRunArtifacts = useEffectEvent(async (runId: string) => {
    try {
      const response = await patriotApi.getRunArtifacts(runId)
      startTransition(() => setArtifacts(response.artifacts))
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
    if (!deferredSessionId) return
    void refreshSession(deferredSessionId)
  }, [deferredSessionId])

  useEffect(() => {
    if (!selectedRunId) {
      setTimelineEvents([])
      setArtifacts([])
      return
    }

    let closed = false
    setTimelineEvents([])
    void refreshRunArtifacts(selectedRunId)

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

  const createSession = useEffectEvent(async () => {
    setIsCreatingSession(true)
    setError(null)
    try {
      const session = await patriotApi.createSession({
        title: `Session ${new Date().toLocaleDateString()}`,
        createdBy: "operator",
      })
      await refreshSessions()
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
  })

  const ensureSession = useEffectEvent(async () => {
    if (selectedSessionId) return selectedSessionId

    const session = await patriotApi.createSession({
      title: `Session ${new Date().toLocaleDateString()}`,
      createdBy: "operator",
    })

    await refreshSessions()
    startTransition(() => {
      setSelectedSessionId(session.id)
    })
    return session.id
  })

  const submitMessage = useEffectEvent(async () => {
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
          source: "web",
          mode: "execute",
          tier: "recon",
          safetyEnabled: true,
          createdBy: "operator",
        },
      })
      setDraft("")
      if (result.run) {
        startTransition(() => {
          setSelectedRunId(result.run?.id ?? null)
          setTimelineEvents([])
        })
      }
      await refreshSession(sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSubmitting(false)
    }
  })

  const stopRun = useEffectEvent(async () => {
    if (!selectedRunId) return
    setIsStopping(true)
    try {
      await patriotApi.stopRun(selectedRunId)
      if (selectedSessionId) await refreshSession(selectedSessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsStopping(false)
    }
  })

  const traceState = useMemo(() => {
    const visibleTimelineEvents = timelineEvents.filter((event) => event.kind !== "artifact")
    const latestEvent = visibleTimelineEvents.at(-1) ?? null
    const triggerText =
      latestEvent
        ? formatTraceEvent(latestEvent).label
        : selectedRun?.status === "running"
          ? "Agent is executing the current run"
          : selectedRun
            ? `Run ${selectedRun.id.slice(0, 8)} ${selectedRun.status}`
            : "Awaiting agent trace"

    return {
      latestEvent,
      triggerText,
      visibleTimelineEvents,
      hasTrace: Boolean(selectedRun) || visibleTimelineEvents.length > 0,
    }
  }, [selectedRun, timelineEvents])

  return (
    <div className="relative h-dvh overflow-hidden bg-[#101010] text-white industrial-grid">
      <PatriotIntro visible={showIntro} />
      <PatriotHeader active="console" />
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

            <div className="mt-4 flex flex-wrap gap-2">
              {sessions.length === 0 ? (
                <div className="text-xs uppercase tracking-[0.18em] text-white/35">No sessions</div>
              ) : (
                sessions.slice(0, 6).map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setSelectedSessionId(session.id)}
                    className={cn(
                      "max-w-full truncate border px-2 py-1 text-[10px] uppercase tracking-[0.18em]",
                      session.id === selectedSessionId
                        ? "border-[#ec3844] bg-[#190d11] text-white"
                        : "border-white/10 bg-[#101010] text-white/50 hover:text-white",
                    )}
                  >
                    {session.title}
                  </button>
                ))
              )}
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
                  <TraceStepsCard
                    run={selectedRun}
                    timelineEvents={traceState.visibleTimelineEvents}
                    triggerText={traceState.triggerText}
                    isActive={selectedRun?.status === "running"}
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
                placeholder="Run a safe recon check against 127.0.0.1 and summarize the environment."
                className="h-28 w-full resize-none bg-transparent px-3 py-3 text-[13px] leading-6 text-white outline-none placeholder:text-white/20"
              />
              <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">
                  Execute / Recon / Safety on
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
              <SummaryPanel sessionState={sessionState} selectedRun={selectedRun} runCount={runs.length} />
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
    <article className="ml-auto max-w-[88%] border border-[#ec3844]/35 bg-[#170d11] px-4 py-3 text-right">
      <div className="mb-2 flex items-center justify-end gap-3 text-[10px] uppercase tracking-[0.18em] text-white/38">
        {at ? <div>{formatTime(at)}</div> : null}
        <div className="border border-[#ec3844]/35 px-2 py-1 text-[#ffb7bc]">Operator</div>
      </div>
      <div className="whitespace-pre-wrap text-[13px] leading-6 text-white">{content}</div>
    </article>
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
  return (
    <article className="mr-12 max-w-[92%] px-1 py-1 font-mono">
      <div className="mb-2 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-white/38">
        <div>{role === "assistant" ? "Patriot" : "System"}</div>
        {at ? <div>{formatTime(at)}</div> : null}
      </div>
      <div className="whitespace-pre-wrap text-[12px] leading-6 text-white/78">{content}</div>
    </article>
  )
}

function TraceStepsCard({
  run,
  timelineEvents,
  triggerText,
  isActive,
}: {
  run: RunRecord | null
  timelineEvents: TimelineEvent[]
  triggerText: string
  isActive: boolean
}) {
  return (
    <article className="mr-12 max-w-[92%] px-1 py-1 font-mono">
      <div className="mb-3 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-white/38">
        <div>Agent trace</div>
        {run ? <div>{run.id.slice(0, 8)} / {run.status}</div> : null}
      </div>

      <Steps defaultOpen>
        <StepsTrigger className="text-left font-mono text-[11px] uppercase tracking-[0.16em] text-white/80 hover:text-white">
          {isActive ? (
            <TextShimmer className="font-mono text-[11px] uppercase tracking-[0.16em]">
              {triggerText}
            </TextShimmer>
          ) : (
            <span className="text-white/76">{triggerText}</span>
          )}
        </StepsTrigger>
        <StepsContent
          className="pt-1"
          bar={<div className="h-full w-px bg-[#ec3844]/28" />}
        >
          <div className="space-y-2">
            {timelineEvents.length === 0 ? (
              <StepsItem className="font-mono text-[12px] leading-5 text-white/52">
                Waiting for live trace events...
              </StepsItem>
            ) : (
              timelineEvents.map((event) => (
                (() => {
                  const formatted = formatTraceEvent(event)
                  return (
                    <StepsItem
                      key={event.id}
                      className={cn(
                        "border px-3 py-2 font-mono text-[12px] leading-5 text-white/64",
                        timelineTone(event.status),
                        event.id === timelineEvents.at(-1)?.id && "text-white/88",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em] text-white/36">
                        <span>{event.kind}</span>
                        <span>{formatTime(event.ts)}</span>
                      </div>
                      <div className="mt-2 whitespace-pre-wrap">{formatted.label}</div>
                      {formatted.facts.length > 0 ? (
                        <div className="mt-2 space-y-1 text-[11px] leading-5 text-white/50">
                          {formatted.facts.map((fact) => (
                            <div key={fact}>{fact}</div>
                          ))}
                        </div>
                      ) : null}
                    </StepsItem>
                  )
                })()
              ))
            )}
          </div>
        </StepsContent>
      </Steps>
    </article>
  )
}

function EmptyChatState({ copy }: { copy: string }) {
  return (
    <div className="mr-12 max-w-[92%] border border-dashed border-white/10 bg-[#101010] px-4 py-5 font-mono text-[12px] leading-6 text-white/55">
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
  selectedRun,
  runCount,
}: {
  sessionState: SessionStateResponse | null
  selectedRun: RunRecord | null
  runCount: number
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

      <div className="border border-white/10 bg-[#101010] p-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
          <Play size={14} />
          Reduced narrative
        </div>
        <div className="whitespace-pre-wrap text-[13px] leading-7 text-white/82">
          {sessionState.report.narrative.summary}
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
