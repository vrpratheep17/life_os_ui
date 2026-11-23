import { useId } from 'react'
import styles from './AvatarChat.module.css'

export default function RobotArt() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return <svg className={styles.robotArt} viewBox="0 0 80 100" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-shell`} x1="14" y1="18" x2="65" y2="70" gradientUnits="userSpaceOnUse"><stop stopColor="#e2f7ff"/><stop offset=".5" stopColor="#85b7d4"/><stop offset="1" stopColor="#387295"/></linearGradient>
      <radialGradient id={`${id}-hover`}><stop stopColor="#76e2ff" stopOpacity=".6"/><stop offset="1" stopColor="#76e2ff" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse className={styles.robotShadow} cx="40" cy="94" rx="20" ry="3" fill="#041423" fillOpacity=".45"/>
    <g className={styles.robotBody}>
    <g className={`${styles.robotLeg} ${styles.legLeft}`}>
      <path d="M33 67L32 79" stroke="#638fab" strokeWidth="7" strokeLinecap="round"/>
      <circle cx="32" cy="79" r="4" fill="#345d79"/>
      <g className={`${styles.robotKnee} ${styles.kneeLeft}`}><path d="M32 79L32 88" stroke="#a2cee4" strokeWidth="6" strokeLinecap="round"/><rect x="25" y="86" width="13" height="6" rx="3" fill="#bfe5f4"/></g>
    </g>
    <g className={`${styles.robotLeg} ${styles.legRight}`}>
      <path d="M47 67L48 79" stroke="#638fab" strokeWidth="7" strokeLinecap="round"/>
      <circle cx="48" cy="79" r="4" fill="#345d79"/>
      <g className={`${styles.robotKnee} ${styles.kneeRight}`}><path d="M48 79L48 88" stroke="#a2cee4" strokeWidth="6" strokeLinecap="round"/><rect x="42" y="86" width="13" height="6" rx="3" fill="#bfe5f4"/></g>
    </g>
    <g className={`${styles.robotArm} ${styles.armLeft}`}><path d="M25 51L19 60L20 68" stroke="#94cce6" strokeWidth="6" strokeLinecap="round"/><circle cx="20" cy="68" r="4" fill="#c0e7f5"/></g>
    <g className={`${styles.robotArm} ${styles.armRight}`}><path d="M55 51L61 60L60 68" stroke="#94cce6" strokeWidth="6" strokeLinecap="round"/><circle cx="60" cy="68" r="4" fill="#c0e7f5"/></g>
    <rect x="26" y="48" width="28" height="23" rx="10" fill={`url(#${id}-shell)`}/>
    <circle cx="40" cy="67" r="3" fill="#134d6c"/>
    <g className={styles.robotHead}>
    <path d="M40 19V10" stroke="#9edaf1" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="40" cy="8" r="4" fill="#8eefd9"/>
    <rect x="13" y="18" width="54" height="45" rx="18" fill={`url(#${id}-shell)`} stroke="#bce9fa" strokeWidth="1.2"/>
    <rect x="19" y="25" width="42" height="29" rx="12" fill="#102c43"/>
    <ellipse className={styles.robotEye} cx="30" cy="38" rx="4" ry="5" fill="#8deaff"/>
    <ellipse className={styles.robotEye} cx="50" cy="38" rx="4" ry="5" fill="#8deaff"/>
    <path className={styles.robotSmile} d="M35 47Q40 51 45 47" stroke="#a1eadb" strokeWidth="2" strokeLinecap="round"/>
    <g className={styles.robotDizzyEyes} stroke="#8deaff" strokeWidth="1.8" strokeLinecap="round"><path d="M25 34L34 42M34 34L25 42M46 34L55 42M55 34L46 42"/><path d="M36 48Q40 44 44 48" stroke="#a1eadb"/></g>
    <path d="M22 22Q31 18 38 21" stroke="white" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round"/>
    </g>
    </g>
  </svg>
}
