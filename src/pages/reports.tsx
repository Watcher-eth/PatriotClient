import { PatriotReportsPage } from "@/components/patriot/patriot-reports-page"
import { PATRIOT_PAGE_SEO, PatriotPageHead } from "@/components/patriot/patriot-page-head"

export default function ReportsPage() {
  return (
    <>
      <PatriotPageHead {...PATRIOT_PAGE_SEO.reports} />
      <PatriotReportsPage />
    </>
  )
}
