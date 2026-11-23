import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Euler, MathUtils, Quaternion, Vector3 } from 'three'
import type { Bone, Object3D } from 'three'

export type AvatarPointer = { x: number; y: number; active: boolean }
export default function AvatarGaze({ scene, head, pointer, enabled }: {
  scene: Object3D; head: Bone | null; pointer: RefObject<AvatarPointer>; enabled: boolean
}) {
  const joints = useMemo(() => {
    const result: { bone: Bone; weight: number; base: Quaternion }[] = []
    scene.traverse(node => {
      if (!(node as Bone).isBone) return
      if (node.name.endsWith('Neck')) result.push({ bone: node as Bone, weight: .3, base: new Quaternion() })
      if (node.name.endsWith('Head')) result.push({ bone: node as Bone, weight: .7, base: new Quaternion() })
    })
    return result.sort((a, b) => a.weight - b.weight)
  }, [scene])
  const smooth = useRef({ yaw: 0, pitch: 0, applied: false })
  const scratch = useMemo(() => ({ screen: new Vector3(), world: new Quaternion(), parent: new Quaternion(), delta: new Quaternion(), euler: new Euler() }), [])
  const restore = () => {
    if (!smooth.current.applied) return
    joints.forEach(({ bone, base }) => bone.quaternion.copy(base))
    smooth.current.applied = false
  }
  useEffect(() => () => { joints.forEach(({ bone, base }) => { if (smooth.current.applied) bone.quaternion.copy(base) }) }, [joints])
  useFrame(restore, -1)
  useFrame(({ camera, gl }, delta) => {
    if (!head || !enabled) { smooth.current.yaw = 0; smooth.current.pitch = 0; return }
    let yaw = 0, pitch = 0
    if (pointer.current.active) {
      const rect = gl.domElement.getBoundingClientRect()
      head.updateWorldMatrix(true, false)
      head.getWorldPosition(scratch.screen).project(camera)
      const x = (pointer.current.x - rect.left) / rect.width * 2 - 1
      const y = 1 - (pointer.current.y - rect.top) / rect.height * 2
      yaw = MathUtils.clamp((x - scratch.screen.x) * .65, -.46, .46)
      pitch = MathUtils.clamp(-(y - scratch.screen.y) * .4, -.22, .28)
    }
    const step = Math.min(delta, .05)
    smooth.current.yaw = MathUtils.damp(smooth.current.yaw, yaw, 18, step)
    smooth.current.pitch = MathUtils.damp(smooth.current.pitch, pitch, 18, step)
    joints.forEach(({ bone, weight, base }) => {
      base.copy(bone.quaternion)
      scratch.euler.set(smooth.current.pitch * weight, smooth.current.yaw * weight, 0)
      scratch.delta.setFromEuler(scratch.euler)
      bone.getWorldQuaternion(scratch.world).premultiply(scratch.delta)
      bone.parent!.getWorldQuaternion(scratch.parent).invert()
      bone.quaternion.copy(scratch.parent.multiply(scratch.world))
      bone.updateWorldMatrix(false, true)
    })
    smooth.current.applied = true
  })
  return null
}
