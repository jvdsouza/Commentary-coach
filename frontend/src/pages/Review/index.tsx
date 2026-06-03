import React, { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router'
import type { AnalysisData } from '../Index/types'
import AnalysisResult from '../../components/AnalysisResult'

type State = { result: AnalysisData } | null

export default function Review() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()

  const stateResult = (location.state as State)?.result ?? null
  const [result, setResult] = useState<AnalysisData | null>(stateResult)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (result || !id || id === 'local') return

    fetch(`http://localhost:3000/api/reviews/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json() as Promise<AnalysisData>
      })
      .then(setResult)
      .catch((e: Error) => setError(e.message))
  }, [id, result])

  if (error) {
    return (
      <div>
        <p>Could not load review: {error}</p>
        <Link to="/">← Back to upload</Link>
      </div>
    )
  }

  if (!result) {
    return (
      <div>
        <p>Loading…</p>
        <Link to="/">← Back to upload</Link>
      </div>
    )
  }

  return (
    <div>
      <Link to="/">← New upload</Link>
      <AnalysisResult result={result} />
    </div>
  )
}
