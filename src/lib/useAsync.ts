import { useCallback, useEffect, useState } from 'react'

export interface AsyncResult<T> {
  data: T | null
  loading: boolean
  error: boolean
  reload: () => void
}

/**
 * Run an async factory on mount (and when `deps` change), tracking loading and
 * error state. Every consumer therefore gets a consistent loading -> data/error
 * lifecycle, satisfying the "loading + friendly error" rule in docs/SPEC.md.
 */
export function useAsync<T>(factory: () => Promise<T>, deps: unknown[]): AsyncResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    factory()
      .then((result) => {
        if (!active) return
        setData(result)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError(true)
        setLoading(false)
      })
    return () => {
      active = false
    }
    // factory is intentionally excluded; callers pass a stable `deps` list.
  }, [...deps, nonce])

  return { data, loading, error, reload }
}
