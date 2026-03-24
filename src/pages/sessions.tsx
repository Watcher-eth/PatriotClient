import { PatriotSessionsPage } from "@/components/patriot/patriot-sessions-page"
import { PATRIOT_PAGE_SEO, PatriotPageHead } from "@/components/patriot/patriot-page-head"

export default function SessionsPage() {
  return (
    <>
      <PatriotPageHead {...PATRIOT_PAGE_SEO.sessions} />
      <PatriotSessionsPage />
    </>
  )
}
