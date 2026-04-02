import { useRouter } from "next/router"

import { PatriotPageHead } from "@/components/patriot/patriot-page-head"
import { PatriotDashboard } from "@/components/patriot/patriot-dashboard"

export default function SessionDetailRoute() {
  const router = useRouter()
  const sessionId = typeof router.query.id === "string" ? router.query.id : ""
  const shortId = sessionId ? sessionId.slice(0, 8) : "Session"

  if (!sessionId) return null

  return (
    <>
      <PatriotPageHead
        title={`Session ${shortId}`}
        description="Continue a Patriot session with the full operator console, findings workspace, and session trace."
        path={`/session/${sessionId}`}
      />
      <PatriotDashboard
        sessionId={sessionId}
        onSessionChange={(nextSessionId) => {
          if (nextSessionId === sessionId) return
          void router.push(`/session/${nextSessionId}`)
        }}
      />
    </>
  )
}
