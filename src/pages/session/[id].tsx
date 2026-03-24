import { useRouter } from "next/router"

import { PatriotPageHead } from "@/components/patriot/patriot-page-head"
import { PatriotSessionDetailPage } from "@/components/patriot/patriot-session-detail-page"

export default function SessionDetailRoute() {
  const router = useRouter()
  const sessionId = typeof router.query.id === "string" ? router.query.id : ""
  const shortId = sessionId ? sessionId.slice(0, 8) : "Session"

  if (!sessionId) return null

  return (
    <>
      <PatriotPageHead
        title={`Session ${shortId}`}
        description="Review Patriot session state, operator messages, linked runs, and field worker readiness."
        path={`/session/${sessionId}`}
      />
      <PatriotSessionDetailPage sessionId={sessionId} />
    </>
  )
}
