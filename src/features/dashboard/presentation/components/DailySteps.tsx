import { ProgressBar } from '@heroui/react'
import { useDailySteps } from '../hooks/useDailySteps'
import styles from './DailyScore.module.css'
import { useAnimatedNumber } from '../../../../shared/ui'

export default function DailySteps() {
  const { steps, error } = useDailySteps()
  const displayed = useAnimatedNumber(steps?.count ?? null, 1000)
  const progress = steps ? Math.min(100, steps.count/steps.target*100) : 0
  return <section className={`${styles.card} ${styles.stepsCard}`} aria-label="Steps today" data-robot-obstacle>
    <div className={styles.walkTrack} aria-hidden="true"><span/><span/><span/><span/><span/></div>
    <p className={styles.label}>Steps today</p>
    <strong className={styles.value} aria-hidden="true">{steps ? displayed.toLocaleString('en-GB') : '—'}</strong>
    <span className={styles.srOnly} role="status">{steps ? `${steps.count.toLocaleString('en-GB')} steps today` : 'Loading steps'}</span>
    <ProgressBar className={styles.progress} aria-label="Daily step goal progress" value={progress} isIndeterminate={!steps && !error}>
      <ProgressBar.Track className={styles.track}><ProgressBar.Fill className={styles.fill}/></ProgressBar.Track>
    </ProgressBar>
    <p className={styles.detail}>{steps ? `${steps.target.toLocaleString('en-GB')} step goal` : error ? 'Steps unavailable' : 'Loading steps…'}</p>
  </section>
}
