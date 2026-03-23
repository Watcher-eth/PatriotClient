"use client"

import Link from "next/link"
import { startTransition, useEffect, useEffectEvent, useState } from "react"
import { ArrowLeft, ArrowRight, LoaderCircle, MessageSquareText } from "lucide-react"

import { PatriotHeader } from "@/components/patriot/patriot-header"
import { patriotApi, type SessionMessageRecord, type SessionStateResponse } from "@/lib/patriot-api"

function formatDateTime(value?: string) {
  if (!value) return "Unknown"
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function SessionMetric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="border border-white/10 bg-[#101010] p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</div>
      <div className="mt-3 text-sm uppercase tracking-[0.12em] text-white/88">{value}</div>
      {detail ? <div className="mt-3 text-[12px] leading-6 text-white/58">{detail}</div> : null}
    </div>
  )
}

export function PatriotSessionDetailPage({ sessionId }: { sessionId: string }) {
  const [sessionState, setSessionState] = useState<SessionStateResponse | null>(null)
  const [messages, setMessages] = useState<SessionMessageRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshSession = useEffectEvent(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const [stateResponse, messagesResponse] = await Promise.all([
        patriotApi.getSessionState(id),
        patriotApi.getSessionMessages(id),
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
    if (!sessionId) return
    void refreshSession(sessionId)
  }, [sessionId])

  return (
    <div className="relative h-dvh overflow-hidden bg-[#101010] text-white industrial-grid">
      <PatriotHeader active="sessions" />
      <main className="h-[calc(100dvh-52px)] overflow-y-auto font-mono">
        <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col px-6 py-6">
          <div className="border border-white/10 bg-[#101010] px-5 py-5">
            <Link
              href="/sessions"
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45 transition-colors hover:text-white"
            >
              <ArrowLeft size={14} />
              Back to sessions
            </Link>
            <div className="mt-4 text-[11px] uppercase tracking-[0.24em] text-white/40">Session detail</div>
            <div className="mt-2 break-all text-sm uppercase tracking-[0.18em] text-white/88">{sessionId}</div>
          </div>

          {error ? (
            <div className="mt-4 border border-[#ec3844]/50 bg-[#1a0d11] px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-[#ffb3b8]">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-4 flex items-center gap-2 border border-white/10 bg-[#101010] px-4 py-4 text-[11px] uppercase tracking-[0.18em] text-white/45">
              <LoaderCircle className="animate-spin" size={15} />
              Loading session
            </div>
          ) : sessionState ? (
            <>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <SessionMetric label="Status" value={sessionState.session.status} detail={sessionState.session.title} />
                <SessionMetric label="Runs" value={String(sessionState.runs.length).padStart(2, "0")} />
                <SessionMetric label="Findings" value={String(sessionState.state.findings.length).padStart(2, "0")} />
                <SessionMetric label="Assets" value={String(sessionState.state.assets.length).padStart(2, "0")} />
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.9fr)]">
                <section className="space-y-4">
                  <article className="border border-white/10 bg-[#101010] p-5">
                    <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-white/45">Session narrative</div>
                    <div className="whitespace-pre-wrap text-[13px] leading-7 text-white/82">
                      {sessionState.report.narrative.summary || "No session narrative has been generated yet."}
                    </div>
                  </article>

                  <article className="border border-white/10 bg-[#101010] p-5">
                    <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
                      <MessageSquareText size={14} />
                      Message history
                    </div>
                    <div className="space-y-3">
                      {messages.length === 0 ? (
                        <div className="text-[12px] leading-6 text-white/55">No stored messages for this session.</div>
                      ) : (
                        messages.map((message) => (
                          <article
                            key={message.id}
                            className={
                              message.role === "user"
                                ? "ml-auto max-w-[82%] border border-[#ec3844]/35 bg-[#101010] px-4 py-3 text-right"
                                : "max-w-[88%] border border-white/10 bg-[#101010] px-4 py-3"
                            }
                          >
                            <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">
                              {message.role} / {formatDateTime(message.createdAt)}
                            </div>
                            <div className="mt-3 whitespace-pre-wrap text-[13px] leading-7 text-white/82">{message.content}</div>
                          </article>
                        ))
                      )}
                    </div>
                  </article>
                </section>

                <aside className="space-y-4">
                  <article className="border border-white/10 bg-[#101010] p-5">
                    <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-white/45">Session summary hints</div>
                    <div className="space-y-2 text-[12px] leading-6 text-white/68">
                      {sessionState.report.summary_hints.length === 0 ? (
                        <div>No summary hints recorded.</div>
                      ) : (
                        sessionState.report.summary_hints.map((hint) => <div key={hint}>- {hint}</div>)
                      )}
                    </div>
                  </article>

                  <article className="border border-white/10 bg-[#101010] p-5">
                    <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-white/45">Linked runs</div>
                    <div className="space-y-3">
                      {sessionState.runs.length === 0 ? (
                        <div className="text-[12px] leading-6 text-white/55">No runs have been linked to this session yet.</div>
                      ) : (
                        sessionState.runs.map((run) => (
                          <Link
                            key={run.id}
                            href={`/report/${run.id}`}
                            className="flex items-center justify-between gap-3 border border-white/10 bg-[#101010] px-4 py-3 transition-colors hover:border-white/20 hover:bg-[#101010]"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">
                                {run.status} / {formatDateTime(run.updatedAt)}
                              </div>
                              <div className="mt-2 break-all text-[12px] leading-6 text-white/78">{run.id}</div>
                            </div>
                            <ArrowRight size={14} className="shrink-0 text-white/45" />
                          </Link>
                        ))
                      )}
                    </div>
                  </article>
                </aside>
              </div>
            </>
          ) : (
            <div className="mt-4 border border-dashed border-white/10 bg-[#101010] px-4 py-4 text-[12px] leading-6 text-white/55">
              Session detail is unavailable.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
