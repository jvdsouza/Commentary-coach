import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router'
import type { AnalysisData } from '../Index/types'
import AnalysisResult from '../../components/AnalysisResult'
import { apiBaseUrl } from '../../config'
import { authHeaders } from '../../auth'

type State = { result: AnalysisData } | null

export default function Review() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()

  const stateResult = (location.state as State)?.result ?? null
  const [result, setResult] = useState<AnalysisData | null>(stateResult)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (result || !id || id === 'local') return

    fetch(`${apiBaseUrl}/api/reviews/${id}`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json() as Promise<AnalysisData>
      })
      .then(setResult)
      .catch((e: Error) => setError(e.message))
  }, [id, result])

  if (error) {
    return (
      <div className="py-6">
        <p className="text-red-400 text-sm mb-4">Could not load review: {error}</p>
        <Link to="/" className="text-sm text-muted hover:text-white transition-colors">
          ← Back to upload
        </Link>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="py-6">
        <p className="text-muted text-sm mb-4">Loading…</p>
        <Link to="/" className="text-sm text-muted hover:text-white transition-colors">
          ← Back to upload
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full py-6">
      <Link to="/" className="text-sm text-muted hover:text-white transition-colors mb-8 inline-block">
        ← New upload
      </Link>
      <AnalysisResult result={result} />
    </div>
  )
}
