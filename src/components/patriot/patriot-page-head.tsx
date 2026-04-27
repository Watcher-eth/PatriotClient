import Head from "next/head"

type SeoConfig = {
  title: string
  description: string
  path: string
  imagePath?: string
}

const SITE_NAME = "Patriot"
const SITE_DESCRIPTION =
  "Patriot is the operator console for reconnaissance runs, reports, sessions, and local field sensors."
const DEFAULT_THEME_COLOR = "#101010"
const DEFAULT_IMAGE_PATH = "/DaedalusFlag.png"

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "")
}

function ensureLeadingSlash(value: string) {
  return value.startsWith("/") ? value : `/${value}`
}

function normalizeOrigin(value: string | undefined) {
  const trimmed = String(value ?? "").trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimTrailingSlash(trimmed)
  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)) return trimTrailingSlash(`https://${trimmed}`)
  return trimTrailingSlash(trimmed)
}

function isLocalOrigin(value: string) {
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0"
  } catch {
    return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(value)
  }
}

function resolveSiteOrigin() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_PATRIOT_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL,
    process.env.APP_URL,
    process.env.NEXTAUTH_URL,
  ]
    .map(normalizeOrigin)
    .filter(Boolean)

  const publicOrigin = candidates.find((candidate) => !isLocalOrigin(candidate))
  if (publicOrigin) return publicOrigin
  if (typeof window !== "undefined" && window.location.origin) {
    return trimTrailingSlash(window.location.origin)
  }
  return candidates[0] || "http://localhost:3000"
}

function toAbsoluteUrl(origin: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path
  return `${origin}${ensureLeadingSlash(path)}`
}

function buildTitle(title: string) {
  return title === SITE_NAME ? title : `${title} | ${SITE_NAME}`
}

export const PATRIOT_PAGE_SEO = {
  home: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    path: "/",
  },
  sessions: {
    title: "Sessions",
    description: "Browse active Patriot sessions, pending local recon setup, and operator conversation history.",
    path: "/sessions",
  },
  reports: {
    title: "Reports",
    description: "Review Patriot run reports, findings, evidence, assets, and artifacts from completed operations.",
    path: "/reports",
  },
  docs: {
    title: "Documentation",
    description: "Explore Patriot documentation guides and its architecture.",
    path: "/docs",
  },
} satisfies Record<string, SeoConfig>

export function PatriotPageHead({ title, description, path, imagePath = DEFAULT_IMAGE_PATH }: SeoConfig) {
  const siteOrigin = resolveSiteOrigin()
  const canonicalUrl = toAbsoluteUrl(siteOrigin, path)
  const imageUrl = toAbsoluteUrl(siteOrigin, imagePath)
  const twitterHandle = String(process.env.NEXT_PUBLIC_TWITTER_HANDLE ?? "").trim()
  const pageTitle = buildTitle(title)

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="shortcut icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href={DEFAULT_IMAGE_PATH} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:secure_url" content={imageUrl.replace(/^http:\/\//i, "https://")} />
      <meta property="og:image:alt" content={`${pageTitle} preview`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={`${pageTitle} preview`} />
      {twitterHandle ? <meta name="twitter:site" content={twitterHandle} /> : null}
      {twitterHandle ? <meta name="twitter:creator" content={twitterHandle} /> : null}

      <meta name="theme-color" content={DEFAULT_THEME_COLOR} />
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <meta name="application-name" content={SITE_NAME} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            description: SITE_DESCRIPTION,
            url: siteOrigin,
            image: imageUrl,
          }),
        }}
      />
    </Head>
  )
}
