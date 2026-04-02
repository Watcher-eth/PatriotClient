import { useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"

type TypewriterTextProps = {
  text: string
  animate?: boolean
  delayMs?: number
  durationMs?: number
  className?: string
  caretClassName?: string
}

export function TypewriterText({
  text,
  animate = true,
  delayMs = 0,
  durationMs,
  className,
  caretClassName,
}: TypewriterTextProps) {
  const resolvedDuration = useMemo(
    () => durationMs ?? Math.max(180, Math.min(1400, Math.max(text.length, 1) * 18)),
    [durationMs, text.length],
  )
  const [visibleChars, setVisibleChars] = useState(() => (animate ? 0 : text.length))
  const [showCaret, setShowCaret] = useState(() => animate && text.length > 0)

  useEffect(() => {
    if (!animate) return

    let frameId = 0
    let timeoutId = 0
    let animationStart = 0

    timeoutId = window.setTimeout(() => {
      const tick = (timestamp: number) => {
        if (!animationStart) animationStart = timestamp

        const elapsed = timestamp - animationStart
        const progress = Math.min(1, elapsed / resolvedDuration)
        const nextCount = Math.min(text.length, Math.ceil(progress * text.length))

        setVisibleChars(nextCount)

        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick)
        } else {
          setVisibleChars(text.length)
          setShowCaret(false)
        }
      }

      frameId = window.requestAnimationFrame(tick)
    }, delayMs)

    return () => {
      window.clearTimeout(timeoutId)
      window.cancelAnimationFrame(frameId)
    }
  }, [animate, delayMs, resolvedDuration, text])

  const visibleText = animate ? text.slice(0, visibleChars) : text
  const shouldShowCaret = animate ? showCaret : false

  return (
    <span className={cn("inline-flex max-w-full items-baseline", className)}>
      <span className="min-w-0 whitespace-pre-wrap break-words">{visibleText || (shouldShowCaret ? " " : "")}</span>
      {shouldShowCaret ? (
        <span
          aria-hidden="true"
          className={cn("ml-px inline-block h-[1em] w-px shrink-0 animate-pulse bg-current align-[-0.12em]", caretClassName)}
        />
      ) : null}
    </span>
  )
}
