import React, { useState } from 'react'
import type { AnalysisData } from './types'
import { sampleAnalysisData } from '../../fixtures/analysisData'
import { useReviews } from '../../hooks/useReviews'

interface Props {
  onLoad: (data: AnalysisData) => void
}

const placeholderByState: Record<string, string> = {
  idle: 'Open panel to load reviews',
  loading: 'Loading…',
  error: 'Failed to load reviews — is the backend running?',
  success: 'No reviews found',
}

const DevPanel: React.FC<Props> = ({ onLoad }) => {
  const { reviews, state: reviewsState, fetch: fetchReviews } = useReviews()
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const loadFromDb = async () => {
    if (!selectedId) return
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch(`http://localhost:3000/api/reviews/${selectedId}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setStatus(`Error: ${(json as { error?: string }).error ?? res.statusText}`)
        return
      }
      onLoad(await res.json())
      setStatus('Loaded from DB.')
    } catch (e) {
      setStatus(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const placeholder = reviews.length > 0
    ? 'Select a review…'
    : (placeholderByState[reviewsState] ?? 'Select a review…')

  return (
    <details
      style={{ border: '1px dashed #888', padding: '0.75rem', borderRadius: '4px' }}
      onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) fetchReviews() }}
    >
      <summary style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', color: '#888' }}>
        Dev tools
      </summary>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
        <button
          type="button"
          onClick={() => { onLoad(sampleAnalysisData); setStatus('Loaded sample data.') }}
          style={{ alignSelf: 'flex-start' }}
        >
          Load sample data
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={reviewsState === 'loading'}
            style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}
          >
            <option value="">{placeholder}</option>
            {reviews.map((r) => (
              <option key={r.id} value={r.id}>
                [{r.status}] {r.title} — {new Date(r.createdAt).toLocaleString()}
              </option>
            ))}
          </select>
          <button type="button" onClick={loadFromDb} disabled={loading || !selectedId}>
            {loading ? 'Loading…' : 'Load'}
          </button>
        </div>

        {status && <p style={{ margin: 0, fontSize: '0.8rem', color: '#555' }}>{status}</p>}
      </div>
    </details>
  )
}

export default DevPanel
