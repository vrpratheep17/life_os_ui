import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useAnimations, useGLTF } from '@react-three/drei'
import { LoopOnce, LoopRepeat } from 'three'
import type { Bone } from 'three'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import type { OrbitControls as OrbitControlsInstance } from 'three-stdlib'
import styles from './AvatarViewer.module.css'
import DeskScene from './DeskScene'
import BedScene from './BedScene'
import WellbeingIndicators from './WellbeingIndicators'
import { useWellbeing } from '../hooks/useWellbeing'
import AvatarChat from './AvatarChat'
import AvatarTapReaction from './AvatarTapReaction'
import AvatarGaze from './AvatarGaze'
import type { AvatarPointer } from './AvatarGaze'

type AvatarAction = 'Wave' | 'Nod' | 'LookAround'
type ActionRequest = { id: number; name: AvatarAction }

type AvatarProps = {
  motionEnabled: boolean
  working: boolean
  sleeping: boolean
  request: ActionRequest | null
  onReady: () => void
  onActionEnd: () => void
  onTap: () => void
  tapRequest: number
  onTapEnd: () => void
  pointer: RefObject<AvatarPointer>
}

function AnimatedAvatar({ motionEnabled, working, sleeping, request, onReady, onActionEnd, onTap, tapRequest, onTapEnd, pointer }: AvatarProps) {
  const gltf = useGLTF('/models/ch38-avatar-v2.glb?sleep=7')
  const scene = useMemo(() => clone(gltf.scene), [gltf.scene])
  const { actions, mixer } = useAnimations(gltf.animations, scene)
  const head = useMemo(() => {
    let found: Bone | null = null
    scene.traverse(node => { if ((node as Bone).isBone && node.name.endsWith('Head')) found = node as Bone })
    return found
  }, [scene])
  const blinkTiming = useRef({ elapsed: 0, next: 2.4 })

  useEffect(() => {
    if (!tapRequest) return
    const blink = actions.Blink
    if (blink) { blink.reset().setLoop(LoopOnce, 1); blink.clampWhenFinished = false; blink.play() }
  }, [actions, tapRequest])

  useFrame((_, delta) => {
    if (!motionEnabled || sleeping) return
    const timing = blinkTiming.current
    timing.elapsed += Math.min(delta, .1)
    if (timing.elapsed < timing.next) return
    const blink = actions.Blink
    if (blink) {
      blink.reset().setLoop(LoopOnce, 1)
      blink.clampWhenFinished = false
      blink.play()
    }
    timing.elapsed = 0
    timing.next = 3 + Math.random()*4
  })

  useEffect(() => {
    if (!motionEnabled || sleeping) {
      actions.Blink?.stop()
      blinkTiming.current.elapsed = 0
    }
    return () => { actions.Blink?.stop() }
  }, [actions, motionEnabled, sleeping])

  useEffect(() => {
    onReady()
  }, [onReady])

  useEffect(() => {
    const baseName = sleeping ? 'Sleep' : working ? 'Work' : 'Idle'
    const idle = actions[baseName]
    if (!idle) return
    for (const name of ['Idle','Work','Sleep']) {
      if (name === baseName) continue
      const previous = actions[name]
      if (!previous) continue
      previous.paused = false
      if (motionEnabled) previous.fadeOut(.45)
      else previous.stop()
    }
    if (request) {
      idle.paused = false
      idle.fadeOut(.2)
    } else if (motionEnabled) {
      idle.paused = false
      idle.enabled = true
      idle.clampWhenFinished = false
      idle.setLoop(LoopRepeat, Infinity)
      idle.play().fadeIn(.45)
    } else {
      if (working || sleeping) { idle.enabled = true; idle.play().setEffectiveWeight(1) }
      idle.paused = true
    }
  }, [actions, motionEnabled, request, working, sleeping])

  useEffect(() => {
    if (!request) return
    const action = actions[request.name]
    if (!action) { onActionEnd(); return }
    action.reset().setLoop(LoopOnce, 1)
    action.clampWhenFinished = true
    action.fadeIn(.2).play()
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    const finished = (event: { action: unknown }) => {
      if (event.action !== action) return
      action.fadeOut(.22)
      settleTimer = setTimeout(onActionEnd, 240)
    }
    mixer.addEventListener('finished', finished)
    return () => {
      mixer.removeEventListener('finished', finished)
      clearTimeout(settleTimer)
      action.stop()
    }
  }, [actions, mixer, request, onActionEnd])

  return <><primitive object={scene} dispose={null} onClick={(event: { stopPropagation: () => void; delta: number }) => {
    event.stopPropagation()
    if (event.delta < 5) onTap()
  }} /><AvatarGaze scene={scene} head={head} pointer={pointer} enabled={motionEnabled && !working && !sleeping && !request && !tapRequest}/><AvatarTapReaction scene={scene} head={head} request={tapRequest} onEnd={onTapEnd}/></>
}

class ViewerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <div className={styles.fallback}>
      <p>The 3D viewer is unavailable on this device.</p>
    </div>
    return this.props.children
  }
}

export default function AvatarViewer() {
  const wellbeing = useWellbeing()
  const [ready, setReady] = useState(false)
  const [motionEnabled, setMotionEnabled] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [request, setRequest] = useState<ActionRequest | null>(null)
  const [tapRequest, setTapRequest] = useState(0)
  const [mode, setMode] = useState<'standing' | 'working' | 'sleeping'>('standing')
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')
  const working = mode === 'working'
  const sleeping = mode === 'sleeping'
  const actionId = useRef(0)
  const controls = useRef<OrbitControlsInstance>(null)
  const pointer = useRef<AvatarPointer>({ x: 0, y: 0, active: false })
  const handleReady = useCallback(() => setReady(true), [])
  const handleActionEnd = useCallback(() => setRequest(null), [])
  const handleTapEnd = useCallback(() => setTapRequest(0), [])
  const tap = useCallback(() => {
    if (!ready || request || tapRequest || working || sleeping || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setTapRequest(++actionId.current)
  }, [ready, request, tapRequest, working, sleeping])
  const performAction = useCallback((name: AvatarAction) => {
    if (!ready || request || tapRequest || working || sleeping) return
    setRequest({ id: ++actionId.current, name })
  }, [ready, request, tapRequest, working, sleeping])

  useEffect(() => {
    const update = () => { pointer.current.active = false; setVisible(document.visibilityState === 'visible') }
    const blur = () => { pointer.current.active = false }
    document.addEventListener('visibilitychange', update)
    window.addEventListener('blur', blur)
    return () => { document.removeEventListener('visibilitychange', update); window.removeEventListener('blur', blur) }
  }, [])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (!ready || !visible || event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select, [role="dialog"], [role="combobox"], [role="spinbutton"]'))) return
      if (!/^[1-8]$/.test(event.key)) return
      event.preventDefault()
      if (event.key === '7') { setMotionEnabled(enabled => !enabled); return }
      if (event.key === '8') { controls.current?.reset(); return }
      if (request || tapRequest) return
      switch (event.key) {
        case '1': tap(); break
        case '2': setMode(working ? 'standing' : 'working'); break
        case '3': setMode(sleeping ? 'standing' : 'sleeping'); break
        case '4': performAction('Wave'); break
        case '5': performAction('Nod'); break
        case '6': performAction('LookAround'); break
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [ready, visible, request, tapRequest, working, sleeping, tap, performAction])

  useEffect(() => {
    if (!ready || !controls.current) return
    const orbit = controls.current
    if (sleeping) {
      orbit.object.position.set(3.8,3.6,3.8)
      orbit.target.set(0,.7,0)
    } else if (working) {
      orbit.object.position.set(3.2,2.35,4.8)
      orbit.target.set(0,1,.15)
    } else {
      orbit.object.position.set(0,1.28,4.8)
      orbit.target.set(0,1.2,0)
    }
    orbit.update()
    orbit.saveState()
  }, [ready, working, sleeping])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      setMotionEnabled(!preference.matches)
      if (preference.matches) { setRequest(null); setTapRequest(0) }
    }
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  return <div className={styles.viewer} data-motion={motionEnabled && visible}>
    <div className={styles.avatarArea} onPointerMove={event => {
      if (event.pointerType === 'touch') return
      pointer.current = { x: event.clientX, y: event.clientY, active: true }
    }} onPointerLeave={() => { pointer.current.active = false }}>
    <div className={styles.particles} aria-hidden="true">{[0,1,2,3,4,5].map((index) => <span key={index}/>)}</div>
    <WellbeingIndicators side="left" {...wellbeing} />
    <ViewerBoundary>
      <div className={styles.stage}>
        <div className={styles.halo} aria-hidden="true" />
        {!ready && <p className={styles.loading} role="status">Preparing your 3D avatar…</p>}
        <Canvas
          className={styles.canvas}
          camera={{ position: [0, 1.28, 4.8], fov: 34, near: .1, far: 30 }}
          dpr={[1, 1.5]}
          frameloop={visible && (motionEnabled || request || tapRequest) ? 'always' : 'demand'}
          shadows
          gl={{ antialias: true, alpha: true }}
          role="img"
          aria-label="Interactive 3D person. Tap for a playful reaction."
          aria-describedby="avatar-keyboard-shortcuts"
          fallback={<p className={styles.loading}>3D rendering is unavailable on this device.</p>}
        >
          <hemisphereLight args={['#f3f7ff', '#a9b5c8', 1.4]} />
          <directionalLight position={[3, 5, 5]} intensity={2.1} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-2} shadow-camera-right={2} shadow-camera-top={3} shadow-camera-bottom={-1} shadow-normalBias={.025} shadow-radius={4} />
          <directionalLight position={[-3, 2, 3]} intensity={.65} color="#ddeaff" />
          <directionalLight position={[-3, 4, -3]} intensity={1.6} color="#b2cdff" />
          <Suspense fallback={null}>
            <AnimatedAvatar motionEnabled={motionEnabled} working={working} sleeping={sleeping} request={request} onReady={handleReady} onActionEnd={handleActionEnd} onTap={tap} tapRequest={visible ? tapRequest : 0} onTapEnd={handleTapEnd} pointer={pointer} />
            {working && <DeskScene />}
            {sleeping && <BedScene />}
            <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -.015, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <shadowMaterial transparent opacity={.18} />
            </mesh>
          </Suspense>
          <OrbitControls ref={controls} target={[0, 1.2, 0]} enableRotate={false} enablePan={false} enableZoom={false} minDistance={3.1} maxDistance={6.5} minPolarAngle={Math.PI * .3} maxPolarAngle={Math.PI * .65} />
        </Canvas>
      </div>
    </ViewerBoundary>
    <WellbeingIndicators side="right" {...wellbeing} />
    </div>
    <AvatarChat wellbeing={wellbeing.wellbeing} />
    <span id="avatar-keyboard-shortcuts" className={styles.srOnly}>Keyboard shortcuts: 1 playful reaction, 2 work or stand, 3 sleep or wake, 4 wave, 5 nod, 6 look around, 7 pause or play, 8 reset view. Reactions are available while standing.</span>
    <span role="status" className={styles.srOnly}>{tapRequest ? 'Avatar reacting with a playful head wobble and circling stars.' : request ? `Playing ${request.name === 'LookAround' ? 'look around' : request.name.toLowerCase()}.` : ready ? sleeping ? 'Avatar sleeping in bed.' : working ? 'Avatar working at a desk.' : '3D avatar ready.' : 'Loading 3D avatar.'}</span>
  </div>
}
