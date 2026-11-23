import { Button, FieldError, Form, Input, Label, TextField } from '@heroui/react'
import { useState } from 'react'
import styles from './WelcomePage.module.css'

export default function WelcomePage() {
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const unavailable = (feature: string) => setMessage(`${feature} will be available when authentication is connected.`)

  return (
    <div className={styles['welcome-page']}>
      <header className={styles['site-header']}>
        <a className={styles['wordmark']} href="#" aria-label="Life OS home"><span className={styles['brand-symbol']}>✳</span> life<span className={styles['wordmark-os']}>os</span><span className={styles['brand-period']}>.</span></a>
        <span className={styles['header-note']}>A little more intention. A lot more life.</span>
        <a className={styles['header-link']} href="#login">Your space awaits</a>
      </header>
      <main className={styles['landing-layout']}>
        <section className={styles['hero']} aria-labelledby="hero-title">
          <div className={styles['eyebrow']}><span/> THE OPERATING SYSTEM FOR YOU</div>
          <h1 id="hero-title">Less scattered.<br />More <em>in sync.</em></h1>
          <p className={styles['hero-description']}>Your goals, habits, and everyday moments.<br className={styles['desktop-break']} /> Finally, a home for everything that makes you, you.</p>
          <div className={styles['orbit-scene']} role="img" aria-label="An orbital illustration connecting your focus, habits, and goals around one personal space">
            <svg className={styles['orbit-svg']} viewBox="0 0 660 370" fill="none" aria-hidden="true">
              <defs>
                <radialGradient id="orb-glow"><stop stopColor="#c4d9ff" stopOpacity=".65"/><stop offset="1" stopColor="#f5f8fc" stopOpacity="0"/></radialGradient>
                <linearGradient id="orb-fill" x1="259" y1="105" x2="400" y2="269" gradientUnits="userSpaceOnUse"><stop stopColor="#f3f8ff"/><stop offset=".53" stopColor="#6498ec"/><stop offset="1" stopColor="#002776"/></linearGradient>
                <filter id="orb-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="19" stdDeviation="18" floodColor="#002776" floodOpacity=".18"/></filter>
              </defs>
              <ellipse cx="330" cy="195" rx="270" ry="170" fill="url(#orb-glow)"/>
              <g stroke="#a9c2e6" strokeWidth="1">
                <ellipse cx="330" cy="195" rx="254" ry="90" transform="rotate(-20 330 195)"/>
                <ellipse cx="330" cy="195" rx="204" ry="126" transform="rotate(30 330 195)" strokeDasharray="3 6"/>
                <ellipse cx="330" cy="195" rx="110" ry="158" transform="rotate(43 330 195)"/>
              </g>
              <circle cx="330" cy="190" r="76" fill="url(#orb-fill)" filter="url(#orb-shadow)"/>
              <ellipse cx="309" cy="153" rx="30" ry="12" fill="white" opacity=".22" transform="rotate(-36 309 153)"/>
              <path d="M330 155V225M295 190H365M305 165L355 215M305 215L355 165" stroke="white" strokeWidth="8" strokeLinecap="round"/>
              <circle cx="111" cy="238" r="6" fill="#4e7bc0" stroke="#f5f8fc" strokeWidth="4"/>
              <circle cx="514" cy="98" r="7" fill="#7ea5e0" stroke="#f5f8fc" strokeWidth="4"/>
              <circle cx="416" cy="304" r="4" fill="#315fa5"/>
              <path d="M93 107v14m-7-7h14M565 259v14m-7-7h14" stroke="#7295cb" strokeWidth="1.5"/>
              <circle cx="205" cy="314" r="2" fill="#9bb4da"/><circle cx="451" cy="39" r="2" fill="#9bb4da"/>
            </svg>
            <div className={[styles['floating-note'], styles['note-focus']].join(' ')}><span className={styles['note-icon']}>◷</span><div><span className={styles['note-caption']}>MAKE ROOM FOR</span><strong>A little focus.</strong></div><span className={styles['note-spark']}>✧</span></div>
            <div className={[styles['floating-note'], styles['note-habits']].join(' ')}><span className={[styles['note-icon'], styles['green']].join(' ')}>✓</span><div><strong>Small steps. Real growth.</strong><span className={styles['habit-progress']}><i/><i/><i/><i/><i/><i/><i className={styles['empty']}/></span></div></div>
            <span className={styles['scene-label']}>EVERYTHING CONNECTED. BEAUTIFULLY.</span>
          </div>
          <div className={styles['hero-bottom']}><span className={styles['bottom-symbol']}>✧</span><p>For the life you're building.<br /><strong>One intentional day at a time.</strong></p></div>
        </section>
        <section className={styles['login-side']} id="login" aria-labelledby="login-title">
          <div className={styles['login-card']}>
            <h2 id="login-title">Welcome back.</h2>
            <p className={styles['login-subtitle']}>Sign in to your space.</p>
            <Form className={styles['login-form']} onSubmit={(event) => { event.preventDefault(); unavailable('Sign-in') }}>
              <TextField name="email" type="email" isRequired className={styles['login-field']}><Label>Email address</Label><Input placeholder="you@example.com" autoComplete="email"/><FieldError/></TextField>
              <TextField name="password" type={showPassword ? 'text' : 'password'} isRequired className={styles['login-field']}><Label>Password</Label><div className={styles['password-wrap']}><Input placeholder="Enter your password" autoComplete="current-password"/><Button type="button" variant="ghost" className={styles['password-toggle']} aria-label={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</Button></div><FieldError/></TextField>
              <Button type="button" variant="ghost" className={styles['forgot-button']} onPress={() => unavailable('Password recovery')}>Forgot password?</Button>
              <Button type="submit" className={styles['sign-in-button']}>Sign in to Life OS</Button>
            </Form>
            <div className={styles['form-divider']}><span/>or<span/></div>
            <Button variant="outline" className={styles['google-button']} onPress={() => unavailable('Google sign-in')}><svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h5.6a4.8 4.8 0 0 1-2.1 3.2v2.7h3.4c2-1.9 3.1-4.6 3.1-7.9Z"/><path fill="#34A853" d="M12 22c2.8 0 5.1-.9 6.9-2.5l-3.4-2.7c-.9.6-2.1 1-3.5 1-2.7 0-5-1.9-5.8-4.4H2.7v2.8A10.4 10.4 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.2 13.4a6.2 6.2 0 0 1 0-3.8V6.8H2.7a10.4 10.4 0 0 0 0 9.4l3.5-2.8Z"/><path fill="#EA4335" d="M12 5.2c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 12 1a10.4 10.4 0 0 0-9.3 5.8l3.5 2.8C7 7.1 9.3 5.2 12 5.2Z"/></svg>Continue with Google</Button>
            <p className={styles['signup-copy']}>New here? <Button variant="ghost" onPress={() => unavailable('Account creation')}>Create an account</Button></p>
            {message && <p className={styles['form-message']} role="status">{message}</p>}
          </div>
        </section>
      </main>
      <footer className={styles['site-footer']}><span>© {new Date().getFullYear()} Life OS</span><span>Less noise. More living.</span><span className={styles['footer-signature']}>MADE FOR YOUR EVERYDAY <span>✧</span></span></footer>
    </div>
  )
}
