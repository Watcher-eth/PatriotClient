import { useRouter } from "next/router"

import { PatriotReportDetailPage } from "@/components/patriot/patriot-report-detail-page"

export default function ReportDetailRoute() {
  const router = useRouter()
  const runId = typeof router.query.id === "string" ? router.query.id : ""

  if (!runId) return null

  return <PatriotReportDetailPage runId={runId} />
}
