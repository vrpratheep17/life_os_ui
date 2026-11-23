import styles from './CurrentLocation.module.css'

export default function CurrentLocation() {
  return <aside className={styles.location} aria-label="Current demo location: Home" data-robot-obstacle>
    <div className={styles.label}><span className={styles.pin} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span>Location</div>
    <strong className={styles.value}>Home</strong>
    <span className={styles.status}><i aria-hidden="true"/>Here now</span>
  </aside>
}
