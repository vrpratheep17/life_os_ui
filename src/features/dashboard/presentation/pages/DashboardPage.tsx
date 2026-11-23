import { lazy, Suspense } from 'react'
import { WeatherWidget } from '../../../weather'
import DailyScore from '../components/DailyScore'
import DailySteps from '../components/DailySteps'
import DailyOverview from '../components/DailyOverview'
import UpcomingEvents from '../components/UpcomingEvents'
import CurrentLocation from '../components/CurrentLocation'
import { useDailyOverview } from '../hooks/useDailyOverview'
import styles from './DashboardPage.module.css'

const AvatarViewer = lazy(() => import('../components/AvatarViewer'))

export default function DashboardPage() {
  const daily = useDailyOverview()
  const score = daily.overview ? daily.overview.tasks.total ? Math.round(daily.overview.tasks.completed/daily.overview.tasks.total*100) : 0 : null
  return (
    <div className={styles.dashboard}>
      <section className={styles.overviewCard} aria-label="Your day at a glance">
        <img className={styles.overviewArtwork} src="/images/events/work.jpg" alt="" width={960} height={540}/>
        <div className={styles.overview}><DailyScore score={score} error={daily.error} /><DailySteps /><WeatherWidget /><CurrentLocation /></div>
      </section>
      <main className={styles.main} aria-label="Your avatar dashboard">
        <Suspense fallback={<p role="status">Loading your avatar…</p>}>
          <AvatarViewer />
        </Suspense>
        <UpcomingEvents />
        <DailyOverview {...daily} />
        <p className={styles.caption}><span aria-hidden="true">✧</span> Great things start with you.</p>
      </main>
      <footer className={styles.footer}>Your life. Your pace.</footer>
    </div>
  )
}
