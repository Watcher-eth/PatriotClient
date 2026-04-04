import type { GetServerSideProps, InferGetServerSidePropsType } from "next"

import { PatriotSessionsPage } from "@/components/patriot/patriot-sessions-page"
import { PATRIOT_PAGE_SEO, PatriotPageHead } from "@/components/patriot/patriot-page-head"
import { createPatriotApi, resolvePatriotApiBase, type SessionRecord } from "@/lib/patriot-api"

export const getServerSideProps: GetServerSideProps<{ initialSessions: SessionRecord[] }> = async (context) => {
  const forwardedHost = context.req.headers["x-forwarded-host"]
  const host = typeof forwardedHost === "string" ? forwardedHost : context.req.headers.host
  const forwardedProto = context.req.headers["x-forwarded-proto"]
  const protocol =
    typeof forwardedProto === "string"
      ? forwardedProto
      : host?.startsWith("localhost") || host?.startsWith("127.0.0.1")
        ? "http"
        : "https"
  const fallbackBase = host ? `${protocol}://${host}` : undefined

  try {
    const api = createPatriotApi(resolvePatriotApiBase(fallbackBase))
    const response = await api.listSessions({ forceRefresh: true })
    return {
      props: {
        initialSessions: response.sessions,
      },
    }
  } catch {
    return {
      props: {
        initialSessions: [],
      },
    }
  }
}

export default function SessionsPage({ initialSessions }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <PatriotPageHead {...PATRIOT_PAGE_SEO.sessions} />
      <PatriotSessionsPage initialSessions={initialSessions} />
    </>
  )
}
