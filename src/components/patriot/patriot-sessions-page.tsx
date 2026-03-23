"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, LoaderCircle } from "lucide-react"

import { PatriotHeader } from "@/components/patriot/patriot-header"
import { patriotApi, type SessionRecord } from "@/lib/patriot-api"

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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadSessions() {
      setError(null)
      try {
        const response = await patriotApi.listSessions()
        if (!active) return
        setSessions(response.sessions)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadSessions()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="relative h-dvh overflow-hidden bg-[#101010] text-white industrial-grid">
      <PatriotHeader active="sessions" />
      <main className="h-[calc(100dvh-52px)] overflow-y-auto font-mono">
        <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col px-6 py-6">
          <div className="border border-white/10 bg-[#101010] px-5 py-5">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Sessions</div>
            <div className="mt-2 text-sm uppercase tracking-[0.18em] text-white/88">Review prior operator conversations</div>
          </div>

          {error ? (
            <div className="mt-4 border border-[#ec3844]/50 bg-[#1a0d11] px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-[#ffb3b8]">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-4 flex items-center gap-2 border border-white/10 bg-[#101010] px-4 py-4 text-[11px] uppercase tracking-[0.18em] text-white/45">
              <LoaderCircle className="animate-spin" size={15} />
              Loading sessions
            </div>
          ) : sessions.length === 0 ? (
            <div className="mt-4 border border-dashed border-white/10 bg-[#101010] px-4 py-4 text-[12px] leading-6 text-white/55">
              No sessions have been recorded yet.
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/session/${session.id}`}
                  className="group border border-white/10 bg-[#101010] px-4 py-4 transition-colors hover:border-white/20 hover:bg-[#101010]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/38">
                        <span>{session.status}</span>
                        <span>{formatDateTime(session.updatedAt)}</span>
                      </div>
                      <div className="mt-3 text-sm uppercase tracking-[0.12em] text-white/88">
                        {session.title || "Untitled session"}
                      </div>
                      <div className="mt-3 break-all text-[12px] leading-6 text-white/52">{session.id}</div>
                      {session.summary ? (
                        <div className="mt-4 max-w-4xl text-[13px] leading-7 text-white/68">{session.summary}</div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45 group-hover:text-white">
                      Open session
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
