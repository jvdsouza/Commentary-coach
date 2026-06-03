import React, { useState } from 'react'
import styles from './VideoUpload.module.css'
import type { AnalysisData, ExtractAudioResponse } from './types'

interface Props {
  onResult: (result: AnalysisData) => void
}

const VideoUpload: React.FC<Props> = ({ onResult }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string>('')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setVideoFile(file)
    setStatus(file ? `Selected ${file.name}` : '')
  }

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!videoFile) {
      setStatus('Please choose a video file before uploading.')
      return
    }

    const formData = new FormData()
    formData.append('video', videoFile)

    try {
      setStatus('Uploading and transcribing video...')
      const extractRes = await fetch('http://localhost:3000/api/extract-audio', {
        method: 'POST',
        body: formData,
      })
      if (!extractRes.ok) {
        throw new Error((await extractRes.text()) || extractRes.statusText)
      }
      const { reviewId, chunks }: ExtractAudioResponse = await extractRes.json()

      setStatus(`Analysing ${chunks.length} chunk${chunks.length === 1 ? '' : 's'}...`)
      const analysisRes = await fetch('http://localhost:3000/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, chunks }),
      })
      if (!analysisRes.ok) {
        throw new Error((await analysisRes.text()) || analysisRes.statusText)
      }
      const data: AnalysisData = await analysisRes.json()

      onResult(data)
      setStatus('Analysis complete.')
    } catch (error) {
      setStatus(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <section className={styles.uploadCard}>
      <h2 className={styles.uploadTitle}>Upload a video to analyse your commentary</h2>
      <form className={styles.uploadForm} onSubmit={handleUpload}>
        <div className={styles.fileField}>
          <label htmlFor="video-upload">Choose a video file</label>
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
          />
        </div>
        <button className={styles.uploadButton} type="submit">
          Analyse commentary
        </button>
      </form>
      {status && <p className={styles.statusText}>{status}</p>}
    </section>
  )
}

export default VideoUpload
