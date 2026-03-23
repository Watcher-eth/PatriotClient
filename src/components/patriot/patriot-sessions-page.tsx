"use client"

import { startTransition, useDeferredValue, useEffect, useEffectEvent, useState } from "react"
import { LoaderCircle, MessageSquareText, Play, ShieldAlert } from "lucide-react"

import { PatriotHeader } from "@/components/patriot/patriot-header"
import { cn } from "@/lib/utils"
import {
  patriotApi,
  type SessionMessageRecord,
  type SessionRecord,
  type SessionStateResponse,
} from "@/lib/patriot-api"

function formatDateTime(value?: string) {
  if (!value) return "Unknown"
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function PatriotSessionsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const deferredSessionId = useDeferredValue(selectedSessionId)
  const [sessionState, setSessionState] = useState<SessionStateResponse | null>(null)
  const [messages, setMessages] = useState<SessionMessageRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshSessions = useEffectEvent(async () => {
    const response = await patriotApi.listSessions()
    startTransition(() => {
      setSessions(response.sessions)
      setSelectedSessionId((current) => current ?? response.sessions[0]?.id ?? null)
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
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  })

  useEffect(() => {
    void refreshSessions()
  }, [])

  useEffect(() => {
    if (!deferredSessionId) return
    void refreshSession(deferredSessionId)
  }, [deferredSessionId])

  return (
    <div className="relative h-dvh overflow-hidden bg-[#07090c] text-white industrial-grid">
      <PatriotHeader active="sessions" />
      <main className="grid h-[calc(100dvh-52px)] grid-cols-[minmax(320px,1fr)_minmax(0,2fr)] overflow-hidden font-mono">
        <section className="flex min-h-0 min-w-0 flex-col border-r border-white/10 bg-[#090c10]">
          <div className="border-b border-white/10 px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Session registry</div>
            <div className="mt-2 text-sm uppercase tracking-[0.18em] text-white/88">
              {sessions.length.toString().padStart(2, "0")} sessions
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto px-3 py-3">
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <div className="border border-dashed border-white/10 bg-[#0d1116] px-4 py-4 text-[12px] leading-6 text-white/55">
                  No sessions recorded yet.
                </div>
              ) : (
                sessions.map((session) => {
                  const isActive = session.id === selectedSessionId
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setSelectedSessionId(session.id)}
                      className={cn(
                        "w-full border px-3 py-3 text-left transition-colors",
                        isActive
                          ? "border-[#ec3844] bg-[#170d11]"
                          : "border-white/10 bg-[#0d1116] hover:border-white/20",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-white/38">
                        <span>{session.status}</span>
                        <span>{formatDateTime(session.updatedAt)}</span>
                      </div>
                      <div className="mt-2 text-[13px] uppercase tracking-[0.12em] text-white/88">{session.title}</div>
                      {session.summary ? (
                        <div className="mt-3 line-clamp-3 text-[12px] leading-6 text-white/58">{session.summary}</div>
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
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Session detail</div>
            <div className="mt-2 text-sm uppercase tracking-[0.18em] text-white/88">
              {sessionState?.session.title ?? "Awaiting selection"}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {error ? (
              <div className="mb-4 border border-[#ec3844]/50 bg-[#1a0d11] px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-[#ffb3b8]">
                {error}
              </div>
            ) : null}

            {isLoading && !sessionState ? (
              <div className="flex h-full items-center justify-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45">
                <LoaderCircle className="animate-spin" size={16} />
                Loading session
              </div>
            ) : sessionState ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <MetricCard label="Runs" value={String(sessionState.runs.length).padStart(2, "0")} />
                  <MetricCard label="Findings" value={String(sessionState.report.findings.length).padStart(2, "0")} />
                  <MetricCard label="Assets" value={String(sessionState.report.assets.length).padStart(2, "0")} />
                </div>

                <section className="border border-white/10 bg-[#0d1116] p-4">
                  <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
                    <ShieldAlert size={14} />
                    Session narrative
                  </div>
                  <div className="whitespace-pre-wrap text-[13px] leading-7 text-white/80">
                    {sessionState.report.narrative.summary}
                  </div>
                </section>

                <section className="border border-white/10 bg-[#0d1116] p-4">
                  <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
                    <MessageSquareText size={14} />
                    Message history
                  </div>
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-[12px] leading-6 text-white/55">No messages recorded for this session.</div>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className="border border-white/10 bg-[#0a0d11] px-3 py-3">
                          <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-white/38">
                            <span>{message.role}</span>
                            <span>{formatDateTime(message.createdAt)}</span>
                          </div>
                          <div className="mt-2 whitespace-pre-wrap text-[12px] leading-6 text-white/74">{message.content}</div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="border border-white/10 bg-[#0d1116] p-4">
                  <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
                    <Play size={14} />
                    Linked runs
                  </div>
                  <div className="space-y-2">
                    {sessionState.runs.length === 0 ? (
                      <div className="text-[12px] leading-6 text-white/55">No runs have been linked to this session yet.</div>
                    ) : (
                      sessionState.runs.map((run) => (
                        <div key={run.id} className="grid grid-cols-[160px_1fr_180px] gap-3 border border-white/10 bg-[#0a0d11] px-3 py-3 text-[12px] leading-6 text-white/70">
                          <div className="uppercase tracking-[0.14em] text-white/88">{run.status}</div>
                          <div className="truncate">{run.prompt}</div>
                          <div className="text-right text-white/45">{formatDateTime(run.updatedAt)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            ) : (
              <div className="border border-dashed border-white/10 bg-[#0d1116] p-5 text-[12px] leading-6 text-white/55">
                Select a session to review its messages, runs, and summary state.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-[#0d1116] p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</div>
      <div className="mt-3 text-sm uppercase tracking-[0.12em] text-white/88">{value}</div>
    </div>
  )
}
