import { useState, useCallback } from 'react'
import { apiBaseUrl } from '../config'
import { authHeaders } from '../auth'

export interface Review {
  id: string
  title: string
  status: string
  createdAt: string
}

type FetchState = 'idle' | 'loading' | 'success' | 'error'

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [state, setState] = useState<FetchState>('idle')

  const fetch = useCallback(async () => {
    if (state !== 'idle') return
    setState('loading')
    try {
      const res = await window.fetch(`${apiBaseUrl}/api/reviews`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      setReviews(await res.json())
      setState('success')
    } catch {
      setState('error')
    }
  }, [state])

  return { reviews, state, fetch }
}
