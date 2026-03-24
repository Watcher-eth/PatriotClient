import { PatriotDashboard } from "@/components/patriot/patriot-dashboard"
import { PATRIOT_PAGE_SEO, PatriotPageHead } from "@/components/patriot/patriot-page-head"

export default function HomePage() {
  return (
    <>
      <PatriotPageHead {...PATRIOT_PAGE_SEO.home} />
      <PatriotDashboard />
    </>
  )
}
