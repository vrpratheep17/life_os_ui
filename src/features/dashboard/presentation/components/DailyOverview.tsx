import { Checkbox, ProgressCircle } from '@heroui/react'
import type { DailyOverview as Overview } from '../../domain/dailyOverview'
import styles from './DailyOverview.module.css'

type Props = { overview: Overview | null; error: boolean; pendingId: string | null; saveError: boolean; announcement: string; onToggle: (id: string, achieved: boolean) => void }
const categories = [
  { name: 'Morning', icon: '\u2600', subtitle: 'Start with intention', ids: ['wake', 'journal'] },
  { name: 'Movement', icon: '\u2301', subtitle: 'Make room to move', ids: ['steps', 'workout'] },
  { name: 'Mind', icon: '\u2727', subtitle: 'Invest in yourself', ids: ['read', 'meditate'] },
]

export default function DailyOverview({ overview, error, pendingId, saveError, announcement, onToggle }: Props) {
  const progress = overview && overview.tasks.total > 0 ? overview.tasks.completed/overview.tasks.total*100 : 0
  return <section className={styles.overview} aria-labelledby="everyday-goal-title">
    <div className={styles.heading}>
      <div><span className={styles.eyebrow}>YOUR DAILY RITUALS</span><h2 id="everyday-goal-title">A little better, every day.</h2><p className={styles.subtitle}>Small commitments. Meaningful progress.</p></div>
      <div className={styles.progressSummary}>
        <div className={styles.ringWrap}>
          <ProgressCircle className={styles.ringRoot} aria-label="Daily goals completed" value={progress} isIndeterminate={!overview && !error}>
            <ProgressCircle.Track className={styles.ring}><ProgressCircle.TrackCircle className={styles.ringTrack}/><ProgressCircle.FillCircle className={styles.ringFill}/></ProgressCircle.Track>
          </ProgressCircle>
          <strong className={styles.ringValue}>{overview ? `${overview.tasks.completed}/${overview.tasks.total}` : '—'}</strong>
        </div><span className={styles.progressLabel}>goals achieved</span>
      </div>
    </div>
    {!overview && <p className={styles.message} role="status">{error ? 'Goals are unavailable. Please refresh to try again.' : 'Loading your goals…'}</p>}
    <div className={styles.grid}>
      {overview && categories.map((category) => {
        const goals = overview.goals.filter((goal) => category.ids.includes(goal.id) || (category.name === 'Mind' && !categories.some((group) => group.ids.includes(goal.id))))
        const completed = goals.filter((goal) => goal.achieved).length
        return <article key={category.name} className={styles.category} data-complete={goals.length > 0 && completed === goals.length} data-robot-obstacle>
          <div className={styles.categoryHeader}><span className={styles.categoryIcon} aria-hidden="true">{category.icon}</span><span className={styles.categoryCount}>{goals.length > 0 && completed === goals.length ? 'Complete ✓' : `${completed} / ${goals.length}`}</span></div>
          <h3>{category.name}</h3><p className={styles.categorySubtitle}>{category.subtitle}</p>
          <ul className={styles.list}>{goals.map((goal) => <li key={goal.id}>
            <Checkbox className={styles.goal} isSelected={goal.achieved} isDisabled={pendingId !== null} aria-label={`${goal.title}: achieved`} onChange={(achieved) => onToggle(goal.id, achieved)}>
              <Checkbox.Content className={styles.goalContent}><span className={styles.goalCopy}><span className={styles.goalTitle}>{goal.title}</span><span className={styles.goalStatus}>{goal.achieved ? 'Achieved' : 'Mark when done'}</span></span><Checkbox.Control className={styles.control}><Checkbox.Indicator /></Checkbox.Control></Checkbox.Content>
            </Checkbox>
          </li>)}</ul>
        </article>
      })}
    </div>
    <p className={styles.feedback} data-success={!!announcement && !saveError && !pendingId} role={saveError ? 'alert' : 'status'}>{saveError ? 'Could not save that change. Please try again.' : pendingId ? 'Saving your progress…' : announcement || (overview ? `${overview.tasks.total-overview.tasks.completed} goals left for today` : '')}</p>
  </section>
}
