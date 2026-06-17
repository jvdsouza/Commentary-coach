import React, { useRef, useState } from 'react'
import type { AnalysisData, ExtractAudioResponse } from './types'

interface Props {
  onResult: (result: AnalysisData) => void
}

type Stage = 'idle' | 'transcribing' | 'analysing' | 'error'

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function StepRow({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-3 transition-opacity ${!active && !done ? 'opacity-35' : ''}`}>
      <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
        {done ? (
          <svg className="w-4 h-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : active ? (
          <svg className="w-4 h-4 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <div className="w-4 h-4 rounded-full border border-white/20" />
        )}
      </div>
      <span className={`text-sm ${active ? 'text-white font-medium' : done ? 'text-muted' : 'text-faint'}`}>
        {label}
      </span>
    </div>
  )
}

const VideoUpload: React.FC<Props> = ({ onResult }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState<string | null>(null)

  const isProcessing = stage === 'transcribing' || stage === 'analysing'

  const pickFile = (f: File | null) => {
    setFile(f)
    setError(null)
    if (stage === 'error') setStage('idle')
  }

  const clearFile = () => {
    pickFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) pickFile(f)
  }

  const handleSubmit = async () => {
    if (!file) return

    setError(null)
    setStage('transcribing')

    try {
      const formData = new FormData()
      formData.append('video', file)

      const extractRes = await fetch('http://localhost:3000/api/extract-audio', {
        method: 'POST',
        body: formData,
      })
      if (!extractRes.ok) throw new Error((await extractRes.text()) || extractRes.statusText)
      const { reviewId, chunks }: ExtractAudioResponse = await extractRes.json()

      setStage('analysing')

      const analysisRes = await fetch('http://localhost:3000/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, chunks }),
      })
      if (!analysisRes.ok) throw new Error((await analysisRes.text()) || analysisRes.statusText)

      onResult(await analysisRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStage('error')
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void handleSubmit() }} className="flex flex-col gap-3">
      {/* File zone */}
      {!file ? (
        <>
          <input
            ref={inputRef}
            id="video-file"
            type="file"
            accept="video/*"
            className="sr-only"
            disabled={isProcessing}
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          <label
            htmlFor="video-file"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center gap-3 py-12 rounded-lg border-2 border-dashed border-white/15 cursor-pointer hover:border-white/30 hover:bg-white/[0.02] transition-colors"
          >
            <svg className="w-7 h-7 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <div className="text-center">
              <p className="text-white text-sm font-medium">Choose a video file</p>
              <p className="text-muted text-xs mt-1">or drag and drop · MP4, MOV, AVI and more</p>
            </div>
          </label>
        </>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 bg-surface rounded-lg border border-white/10">
          <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{file.name}</p>
            <p className="text-muted text-xs mt-0.5">{formatBytes(file.size)}</p>
          </div>
          {!isProcessing && (
            <button
              type="button"
              onClick={clearFile}
              className="text-faint hover:text-white transition-colors flex-shrink-0"
              aria-label="Remove file"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Progress */}
      {isProcessing && (
        <div className="bg-surface rounded-lg border border-white/10 px-5 py-4 flex flex-col gap-3">
          <StepRow
            active={stage === 'transcribing'}
            done={stage === 'analysing'}
            label="Uploading and processing your video"
          />
          <StepRow
            active={stage === 'analysing'}
            done={false}
            label="Analysing your commentary"
          />
        </div>
      )}

      {/* Error */}
      {stage === 'error' && error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            type="button"
            onClick={() => { setStage('idle'); setError(null) }}
            className="text-xs text-muted hover:text-white mt-2 transition-colors"
          >
            ← Try again
          </button>
        </div>
      )}

      {/* CTA */}
      {!isProcessing && (
        <button
          type="submit"
          disabled={!file}
          className="w-full mt-1 py-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-25 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          Analyse commentary
        </button>
      )}
    </form>
  )
}

export default VideoUpload
