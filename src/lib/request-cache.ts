type CacheEntry<T> = {
  value: T
  cachedAt: number
  expiresAt: number
}

const responseCache = new Map<string, CacheEntry<unknown>>()
const inflightRequests = new Map<string, Promise<unknown>>()

export function peekCachedValue<T>(key: string): { value: T; cachedAt: number; expiresAt: number; isStale: boolean } | null {
  const entry = responseCache.get(key)
  if (!entry) return null

  return {
    value: entry.value as T,
    cachedAt: entry.cachedAt,
    expiresAt: entry.expiresAt,
    isStale: entry.expiresAt <= Date.now(),
  }
}

export function setCachedValue<T>(key: string, value: T, ttlMs: number) {
  const now = Date.now()
  responseCache.set(key, {
    value,
    cachedAt: now,
    expiresAt: now + Math.max(ttlMs, 0),
  })
}

export function invalidateCachedValue(key: string) {
  responseCache.delete(key)
  inflightRequests.delete(key)
}

export async function getOrLoadCachedValue<T>({
  key,
  ttlMs,
  forceRefresh = false,
  load,
}: {
  key: string
  ttlMs: number
  forceRefresh?: boolean
  load: () => Promise<T>
}) {
  if (!forceRefresh) {
    const cached = peekCachedValue<T>(key)
    if (cached && !cached.isStale) {
      return cached.value
    }

    const inflight = inflightRequests.get(key)
    if (inflight) {
      return (await inflight) as T
    }
  }

  const promise = load()
    .then((value) => {
      setCachedValue(key, value, ttlMs)
      return value
    })
    .finally(() => {
      if (inflightRequests.get(key) === promise) {
        inflightRequests.delete(key)
      }
    })

  inflightRequests.set(key, promise as Promise<unknown>)
  return await promise
}
