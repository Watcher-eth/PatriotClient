import "@/styles/globals.css"
import type { AppProps } from "next/app"

import { PatriotRouteTransition } from "@/components/patriot/patriot-route-transition"

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <PatriotRouteTransition routeKey={router.asPath}>
      <Component {...pageProps} />
    </PatriotRouteTransition>
  )
}
