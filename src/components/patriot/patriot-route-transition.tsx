import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react"
import { useRouter } from "next/router"

type PatriotRouteTransitionProps = {
  children: ReactNode
  routeKey: string
}

const pageEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function PatriotRouteTransition({ children, routeKey }: PatriotRouteTransitionProps) {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    const handleStart = (nextUrl: string) => {
      if (nextUrl !== router.asPath) setIsNavigating(true)
    }
    const handleStop = () => {
      setIsNavigating(false)
    }

    router.events.on("routeChangeStart", handleStart)
    router.events.on("routeChangeComplete", handleStop)
    router.events.on("routeChangeError", handleStop)

    return () => {
      router.events.off("routeChangeStart", handleStart)
      router.events.off("routeChangeComplete", handleStop)
      router.events.off("routeChangeError", handleStop)
    }
  }, [router])

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-hidden bg-[#101010]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={routeKey}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.985 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -18, scale: 1.01 }}
            transition={{
              duration: prefersReducedMotion ? 0.16 : 0.46,
              ease: prefersReducedMotion ? "easeOut" : pageEase,
            }}
            className="min-h-screen will-change-transform"
          >
            {children}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {isNavigating ? (
            <motion.div
              key="route-veil"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.12 : 0.22, ease: "easeOut" }}
              className="pointer-events-none fixed inset-0 z-[120]"
            >
              <motion.div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_58%)]"
                initial={prefersReducedMotion ? undefined : { scale: 1.02 }}
                animate={prefersReducedMotion ? undefined : { scale: 1 }}
                exit={prefersReducedMotion ? undefined : { scale: 0.995 }}
                transition={{ duration: 0.35, ease: pageEase }}
              />
              <motion.div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px origin-center bg-gradient-to-r from-transparent via-white/55 to-transparent"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scaleX: 0.35 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0.12 : 0.3, ease: pageEase }}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
