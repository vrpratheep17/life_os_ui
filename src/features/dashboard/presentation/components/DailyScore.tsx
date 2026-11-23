import { ProgressCircle } from '@heroui/react'
import styles from './DailyScore.module.css'
import { useAnimatedNumber } from '../../../../shared/ui'

export default function DailyScore({ score, error }: { score: number | null; error: boolean }) {
  const displayed = useAnimatedNumber(score)
  return <section className={`${styles.card} ${styles.scoreCard}`} aria-label="Your score for the day" data-robot-obstacle>
    <p className={styles.label}>Daily score</p>
    <strong className={styles.value} aria-hidden="true">{score === null ? '—' : `${displayed}%`}</strong>
    <span className={styles.srOnly} role="status">{score === null ? 'Loading daily score' : `Daily score: ${score}%`}</span>
    <p className={styles.detail}>Your daily momentum</p>
    <div className={styles.dial}>
      <ProgressCircle className={styles.dialRoot} aria-label="Daily score" value={score ?? 0} isIndeterminate={score === null && !error}>
        <ProgressCircle.Track className={styles.dialSvg}><ProgressCircle.TrackCircle className={styles.dialTrack}/><ProgressCircle.FillCircle className={styles.dialFill}/></ProgressCircle.Track>
      </ProgressCircle>
      <span className={styles.dialLabel} aria-hidden="true">TODAY</span>
    </div>
    {error && <span className={styles.error} role="status">Score unavailable</span>}
  </section>
}
