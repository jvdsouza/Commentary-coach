import React, { memo, useCallback } from 'react'
import { useNavigate } from 'react-router'

import Box from '../../components/Box'
import logo from '../../logo.svg'

import Counter from './Counter'
import VideoUpload from './VideoUpload'
import DevPanel from './DevPanel'
import type { AnalysisData } from './types'
import { featureFlags } from '../../config'
import styles from './index.module.css'

interface Props {}

const Index: React.FC<Props> = memo(() => {
  const navigate = useNavigate()

  const handleResult = useCallback((result: AnalysisData) => {
    navigate(`/review/${result.reviewId ?? 'local'}`, { state: { result } })
  }, [navigate])

  return (
    <>
      <Box>
        <h1 className={styles.h1}>I'm REACT_APP_TEXT from .env</h1>
        <img src={logo} alt="react-logo" className="react-logo" />
      </Box>
      <Box>
        <Counter />
      </Box>
      <Box>
        <VideoUpload onResult={handleResult} />
      </Box>
      {featureFlags.devPanel && (
        <Box>
          <DevPanel onLoad={handleResult} />
        </Box>
      )}
    </>
  )
})
Index.displayName = 'Index'

export default Index
