import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Shape } from 'three'
import type { Bone, Group, Mesh, Object3D } from 'three'
import { createAvatarTapPose } from './avatarTapPose'

export default function AvatarTapReaction({ scene, head, request, onEnd }: { scene: Object3D; head: Bone | null; request: number; onEnd: () => void }) {
  const ring = useRef<Group>(null)
  const stars = useRef<(Mesh | null)[]>([])
  const state = useRef({ active: false, elapsed: 0 })
  const pose = useMemo(() => createAvatarTapPose(scene), [scene])
  useEffect(() => () => pose.restore(), [pose])
  const shape = useMemo(() => {
    const star = new Shape()
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? .018 : .042
      if (i === 0) star.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
      else star.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    }
    star.closePath()
    return star
  }, [])
  useEffect(() => {
    state.current.active = !!request && !!head
    state.current.elapsed = 0
    if (request && !head) onEnd()
  }, [request, head, onEnd])
  // Restore the unmodified pose before the animation mixer evaluates its tracks.
  useFrame(() => {
    pose.restore()
  }, -1)
  useFrame(({ camera }, delta) => {
    const reaction = state.current
    if (!reaction.active || !head) { if (ring.current) ring.current.visible = false; return }
    reaction.elapsed += Math.min(delta, .05)
    const t = reaction.elapsed / 2.6
    if (t >= 1) { reaction.active = false; if (ring.current) ring.current.visible = false; onEnd(); return }
    pose.apply(t)
    head.updateWorldMatrix(true, false)
    if (ring.current) {
      ring.current.visible = t > .12
      head.getWorldPosition(ring.current.position)
      ring.current.position.y += .22
      stars.current.forEach((star, i) => {
        if (!star) return
        const angle = reaction.elapsed * 5.5 + i * Math.PI * 2 / 5
        star.position.set(Math.cos(angle) * .27, Math.sin(angle * 2) * .025, Math.sin(angle) * .16)
        star.quaternion.copy(camera.quaternion)
        star.scale.setScalar(Math.max(0, Math.min(1, (t - .12) * 8)) * Math.min(1, (1 - t) * 5))
      })
    }
  })
  return <group ref={ring} visible={false}>
    {[0, 1, 2, 3, 4].map(i => <mesh key={i} ref={mesh => { stars.current[i] = mesh }}>
      <shapeGeometry args={[shape]}/><meshBasicMaterial color="#ffe499" toneMapped={false}/>
    </mesh>)}
  </group>
}
