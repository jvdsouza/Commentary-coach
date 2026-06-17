import React, { useState } from 'react'
import styles from './index.module.css'

export interface Tab {
  label: string
  content: React.ReactNode
}

interface Props {
  tabs: Tab[]
  defaultIndex?: number
  variant?: 'primary' | 'secondary'
}

const Tabs: React.FC<Props> = ({ tabs, defaultIndex = 0, variant = 'primary' }) => {
  const [activeIndex, setActiveIndex] = useState(defaultIndex)

  return (
    <div>
      <div role="tablist" className={styles.tablist}>
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            role="tab"
            type="button"
            aria-selected={activeIndex === i}
            onClick={() => setActiveIndex(i)}
            className={[
              styles.tab,
              activeIndex === i ? styles.tabActive : '',
              variant === 'secondary' ? styles.tabSecondary : '',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        className={variant === 'primary' ? styles.panel : styles.panelSecondary}
      >
        {tabs[activeIndex]?.content}
      </div>
    </div>
  )
}

export default Tabs
