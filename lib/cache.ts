const store = new Map<string, { data: unknown; expiry: number }>()
const DEFAULT_TTL = 10_000 // 10 seconds

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cached = store.get(key)
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T
  }
  const data = await fetcher()
  store.set(key, { data, expiry: Date.now() + ttl })
  return data
}

export function clearCache(): void {
  store.clear()
}
