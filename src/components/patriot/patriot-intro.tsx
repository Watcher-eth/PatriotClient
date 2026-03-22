import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

type PatriotIntroProps = {
  visible: boolean
}

const cornerLabels = [
  {
    id: "top-left",
    label: "Patriot v1.1",
    className: "left-6 top-5 text-left",
    delay: 0.1,
  },
  {
    id: "top-right",
    label: "Systems Booting",
    className: "right-6 top-5 text-right",
    delay: 0.35,
  },
  {
    id: "bottom-left",
    label: "Runtime Ready",
    className: "bottom-5 left-6 text-left",
    delay: 2.55,
  },
  {
    id: "bottom-right",
    label: "Daedalus Labs, 2026",
    className: "bottom-5 right-6 text-right",
    delay: 2.8,
  },
]

export function PatriotIntro({ visible }: PatriotIntroProps) {
  const [logoPath, setLogoPath] = useState("")

  useEffect(() => {
    let active = true

    async function loadLogoPath() {
      const response = await fetch("/Daedalus.svg")
      const svgText = await response.text()
      const match = svgText.match(/<path d="([^"]+)"/)

      if (active && match) {
        setLogoPath(match[1])
      }
    }

    loadLogoPath().catch(() => {
      setLogoPath("")
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="patriot-intro"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="pointer-events-auto absolute inset-0 z-50 overflow-hidden bg-[#050505]"
        >
          {cornerLabels.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: item.id.includes("bottom") ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: item.delay, duration: 0.45, ease: "easeOut" }}
              className={`absolute font-mono text-[11px] uppercase tracking-[0.24em] text-white/72 ${item.className}`}
            >
              {item.label}
            </motion.div>
          ))}

          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: [0.98, 1.01, 1] }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="relative aspect-[631/633] w-[min(100px,14vw)] max-w-[100px]"
            >
              <svg
                viewBox="-8 -8 647 649"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="xMidYMid meet"
                shapeRendering="geometricPrecision"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="daedalus-shimmer-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                    <stop offset="42%" stopColor="rgba(255,255,255,0)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.85)" />
                    <stop offset="58%" stopColor="rgba(255,255,255,0)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>

                  {logoPath ? (
                    <clipPath id="daedalus-logo-clip" clipPathUnits="userSpaceOnUse">
                      <path d={logoPath} />
                    </clipPath>
                  ) : null}
                </defs>

                {logoPath ? (
                  <>
                    <motion.path
                      d={logoPath}
                      fill="none"
                      stroke="rgba(255,255,255,0.16)"
                      strokeWidth="2.8"
                      strokeLinejoin="miter"
                      strokeLinecap="square"
                      vectorEffect="non-scaling-stroke"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.55, 0.08] }}
                      transition={{ delay: 0.55, duration: 2.3, ease: "easeOut" }}
                    />

                    <motion.path
                      d={logoPath}
                      fill="none"
                      stroke="rgba(255,255,255,0.94)"
                      strokeWidth="1.15"
                      strokeLinejoin="miter"
                      strokeLinecap="square"
                      vectorEffect="non-scaling-stroke"
                      initial={{ pathLength: 0, opacity: 1 }}
                      animate={{ pathLength: 1, opacity: [1, 0.96, 0.18] }}
                      transition={{ delay: 0.22, duration: 2.45, ease: [0.32, 0.02, 0.2, 1] }}
                    />

                    <motion.path
                      d={logoPath}
                      fill="white"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.08, 0.7, 1] }}
                      transition={{ delay: 0.95, duration: 1.35, ease: [0.2, 0.8, 0.2, 1] }}
                    />

                    <motion.rect
                      x="-760"
                      y="0"
                      width="760"
                      height="633"
                      fill="url(#daedalus-shimmer-gradient)"
                      clipPath="url(#daedalus-logo-clip)"
                      initial={{ x: -760, opacity: 0 }}
                      animate={{ x: 760, opacity: [0, 0.12, 0.72, 0.1, 0] }}
                      transition={{ delay: 1.2, duration: 1.45, ease: "easeInOut" }}
                    />

                    <motion.rect
                      x="-760"
                      y="0"
                      width="760"
                      height="633"
                      fill="url(#daedalus-shimmer-gradient)"
                      clipPath="url(#daedalus-logo-clip)"
                      initial={{ x: -760, opacity: 0 }}
                      animate={{ x: 760, opacity: [0, 0.06, 0.28, 0.05, 0] }}
                      transition={{ delay: 2.05, duration: 1.15, ease: "easeInOut" }}
                    />
                  </>
                ) : null}
              </svg>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
