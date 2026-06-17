import React, { memo, useCallback } from 'react'
import { useNavigate } from 'react-router'
import VideoUpload from './VideoUpload'
import DevPanel from './DevPanel'
import type { AnalysisData } from './types'
import { featureFlags } from '../../config'

const Index: React.FC = memo(() => {
  const navigate = useNavigate()

  const handleResult = useCallback((result: AnalysisData) => {
    navigate(`/review/${result.reviewId ?? 'local'}`, { state: { result } })
  }, [navigate])

  return (
    <div className="w-full flex justify-center py-16">
      <div className="w-full max-w-[480px] flex flex-col gap-8">

        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Commentary Coach</h1>
          <p className="text-muted text-sm mt-2 leading-relaxed">
            Upload a session recording to receive detailed coaching feedback.
          </p>
        </div>

        <section className="bg-surface rounded-lg border border-white/10 p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-base font-semibold text-white">New session</h2>
          </div>
          <VideoUpload onResult={handleResult} />
        </section>

        {featureFlags.devPanel && (
          <DevPanel onLoad={handleResult} />
        )}

      </div>
    </div>
  )
})
Index.displayName = 'Index'

export default Index
