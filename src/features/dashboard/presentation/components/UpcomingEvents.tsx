import { useEffect, useState } from 'react'
import { Button } from '@heroui/react'
import { getCalendarAgenda } from '../../adapters/calendarEvents'
import type { CalendarAgenda } from '../../domain/calendarEvents'
import styles from './UpcomingEvents.module.css'

export default function UpcomingEvents() {
  const [day, setDay] = useState<'today' | 'tomorrow'>('today')
  const [agenda, setAgenda] = useState<CalendarAgenda | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setError(false)
    getCalendarAgenda(controller.signal).then(setAgenda).catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [attempt])
  const events = agenda?.[day]
  const date = new Date()
  if (day === 'tomorrow') date.setDate(date.getDate() + 1)
  return <section className={styles.agenda} aria-labelledby="upcoming-events-heading">
    <header className={styles.header}>
      <div className={styles.heading}><span className={styles.dateBadge} aria-hidden="true"><small>{date.toLocaleDateString('en-GB', { month: 'short' })}</small><strong>{date.getDate()}</strong></span><div><span className={styles.eyebrow}>YOUR DAY, AT A GLANCE</span><h2 id="upcoming-events-heading">Upcoming</h2></div></div>
      <div className={styles.switch} role="group" aria-label="Choose agenda day">
        {(['today', 'tomorrow'] as const).map(value => <Button key={value} variant="ghost" className={styles.day} aria-pressed={day === value} onPress={() => setDay(value)}>{value === 'today' ? 'Today' : 'Tomorrow'}</Button>)}
      </div>
    </header>
    {error ? <div className={styles.status} role="status">Unable to load your schedule. <Button variant="ghost" onPress={() => setAttempt(value => value + 1)}>Retry</Button></div> : !events ? <p className={styles.status} role="status">Loading your schedule...</p> : !events.length ? <p className={styles.status}>A little room to breathe. No events planned.</p> : <ol key={day} className={styles.events} tabIndex={0} aria-label={`${day === 'today' ? 'Today' : 'Tomorrow'} events. Scroll to explore.`}>
      {events.map(event => <li key={event.id} className={styles.event} data-category={event.category}>
        <img className={styles.scene} src={`/images/events/${event.category}.jpg`} alt="" loading="lazy" width={960} height={540}/>
        <span className={styles.sheen} aria-hidden="true"/>
        <div className={styles.when}><time>{event.time}</time><span>{event.duration}</span></div>
        <div className={styles.info}><span className={styles.category}>{event.category}</span><h3>{event.title}</h3><p>{event.location}</p></div>
      </li>)}
    </ol>}
  </section>
}
