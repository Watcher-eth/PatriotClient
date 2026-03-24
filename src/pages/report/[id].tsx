import { useRouter } from "next/router"

import { PatriotPageHead } from "@/components/patriot/patriot-page-head"
import { PatriotReportDetailPage } from "@/components/patriot/patriot-report-detail-page"

export default function ReportDetailRoute() {
  const router = useRouter()
  const runId = typeof router.query.id === "string" ? router.query.id : ""
  const shortId = runId ? runId.slice(0, 8) : "Report"

  if (!runId) return null

  return (
    <>
      <PatriotPageHead
        title={`Report ${shortId}`}
        description="Inspect Patriot report findings, evidence, generated assets, and linked artifacts for a completed run."
        path={`/report/${runId}`}
      />
      <PatriotReportDetailPage runId={runId} />
    </>
  )
}
