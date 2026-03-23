import { useRouter } from "next/router"

import { PatriotSessionDetailPage } from "@/components/patriot/patriot-session-detail-page"

export default function SessionDetailRoute() {
  const router = useRouter()
  const sessionId = typeof router.query.id === "string" ? router.query.id : ""

  if (!sessionId) return null

  return <PatriotSessionDetailPage sessionId={sessionId} />
}
