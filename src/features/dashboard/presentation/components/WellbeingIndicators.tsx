import { useId, useState } from 'react'
import type { CSSProperties } from 'react'
import { Button, Popover, ProgressCircle } from '@heroui/react'
import { wellbeingMetrics } from '../../domain/wellbeing'
import type { Wellbeing } from '../../domain/wellbeing'
import styles from './WellbeingIndicators.module.css'
import { useAnimatedNumber } from '../../../../shared/ui'

type Props = { side: 'left' | 'right'; wellbeing: Wellbeing | null; error: boolean }

const details = {
  sleep: 'Your overnight rest score for today.',
  hydration: 'Progress toward your daily hydration goal.',
  upskilled: 'Progress toward your daily learning target.',
  energy: 'Your personal energy check-in for today.',
  focus: 'Progress toward your focused-time goal.',
  recovery: 'Your personal recovery check-in for today.',
}

function AnimatedPercentage({ value }: { value: number | undefined }) {
  const displayed = useAnimatedNumber(value ?? null, 950)
  return <>{value === undefined ? '—' : `${displayed}%`}</>
}

function ProgressGraphic({ value, error, label }: { value: number | undefined; error: boolean; label: string }) {
  const maskId = `progress-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const offset = 100-(value ?? 0)
  return <ProgressCircle className={styles.progressRoot} value={value ?? 0} isIndeterminate={value === undefined && !error} aria-label={error ? `${label} unavailable` : label}>
    <ProgressCircle.Track className={styles.track} viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="11.5" fill="#071a30cc" />
      <ProgressCircle.TrackCircle className={styles.trackCircle} cx={16} cy={16} r={13} strokeWidth={2} />
      <ProgressCircle.FillCircle className={styles.fillCircle} cx={16} cy={16} r={13} strokeWidth={2} pathLength={100} strokeDasharray={100} strokeDashoffset={offset} transform="rotate(-90 16 16)" />
      {value !== undefined && value > 0 && <>
        <defs><mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32"><ProgressCircle.FillCircle cx={16} cy={16} r={13} strokeWidth={3} style={{ stroke: 'white', fill: 'none' }} pathLength={100} strokeDasharray={100} strokeDashoffset={offset} transform="rotate(-90 16 16)" /></mask></defs>
        <ProgressCircle.FillCircle className={styles.sparkCircle} cx={16} cy={16} r={13} strokeWidth={2.1} pathLength={100} strokeDasharray="5 95" strokeDashoffset={0} transform="none" mask={`url(#${maskId})`} />
      </>}
    </ProgressCircle.Track>
  </ProgressCircle>
}

export default function WellbeingIndicators({ side, wellbeing, error }: Props) {
  const [active, setActive] = useState<string | null>(null)
  return <aside className={`${styles.column} ${styles[side]}`} aria-label={`${side === 'left' ? 'Daily wellbeing' : 'Personal energy'} indicators`}>
    {wellbeingMetrics.filter((metric) => metric.side === side).map((metric, index) => {
      const value = wellbeing?.[metric.id]
      return <div className={styles.metric} key={metric.id} data-active={active === metric.id} style={{ '--metric-color': metric.color, '--enter-delay': `${index*90+150}ms` } as CSSProperties}>
        <Popover isOpen={active === metric.id} onOpenChange={(open) => setActive(open ? metric.id : null)}>
        <Button variant="ghost" className={styles.circle} aria-label={`${metric.label}, ${value === undefined ? 'unavailable' : `${Math.round(value)} percent`}. View details.`} isDisabled={value === undefined}>
          <ProgressGraphic value={value} error={error} label={metric.label} />
          <span className={styles.value} aria-hidden="true"><AnimatedPercentage value={value} /></span>
        </Button>
        <Popover.Content placement={side === 'left' ? 'right' : 'left'} className={styles.popover} offset={12} style={{ '--metric-color': metric.color } as CSSProperties}>
          <Popover.Dialog className={styles.dialog}>
            <Popover.Heading className={styles.detailHeading}>{metric.label}</Popover.Heading>
            <strong className={styles.detailValue}>{value}%</strong>
            <p className={styles.detailCopy}>{details[metric.id]}</p>
            <span className={styles.demo}>Demo data · today</span>
          </Popover.Dialog>
        </Popover.Content>
        </Popover>
        <span className={styles.label}>{metric.label}</span>
      </div>
    })}
  </aside>
}
