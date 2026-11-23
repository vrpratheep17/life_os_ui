import { Euler, Quaternion, Vector3 } from 'three'
import type { Bone, Object3D } from 'three'

const names = ['Hips', 'Spine2', 'Neck', 'Head', 'LeftShoulder', 'RightShoulder', 'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm', 'LeftHand', 'RightHand', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'LeftFoot', 'RightFoot'] as const
export function createAvatarTapPose(scene: Object3D) {
  const rig = new Map<string, Bone>()
  scene.traverse(node => {
    if (!(node as Bone).isBone) return
    const suffix = names.find(name => node.name.endsWith(name))
    if (suffix) rig.set(suffix, node as Bone)
  })
  const saved = [...rig.values()].map(bone => ({ bone, quaternion: new Quaternion(), position: new Vector3() }))
  let applied = false
  const at = (bone: Object3D) => bone.getWorldPosition(new Vector3())
  function rotate(name: string, x: number, y: number, z: number) {
    const bone = rig.get(name)
    if (!bone?.parent) return
    const world = new Quaternion().setFromEuler(new Euler(x, y, z)).multiply(bone.getWorldQuaternion(new Quaternion()))
    bone.quaternion.copy(bone.parent.getWorldQuaternion(new Quaternion()).invert().multiply(world))
    bone.updateWorldMatrix(false, true)
  }
  function aim(bone: Bone, child: Bone, target: Vector3) {
    const origin = at(bone)
    const delta = new Quaternion().setFromUnitVectors(at(child).sub(origin).normalize(), target.clone().sub(origin).normalize())
    const world = delta.multiply(bone.getWorldQuaternion(new Quaternion()))
    bone.quaternion.copy(bone.parent!.getWorldQuaternion(new Quaternion()).invert().multiply(world))
    bone.updateWorldMatrix(false, true)
  }
  function chain(side: string, arm: boolean) {
    const upper = rig.get(`${side}${arm ? 'Arm' : 'UpLeg'}`)
    const lower = rig.get(`${side}${arm ? 'ForeArm' : 'Leg'}`)
    const end = rig.get(`${side}${arm ? 'Hand' : 'Foot'}`)
    if (!upper || !lower || !end) return null
    const start = at(upper), middle = at(lower), target = at(end)
    const axis = target.clone().sub(start).normalize()
    const pole = middle.clone().sub(start).projectOnPlane(axis)
    if (pole.lengthSq() < .000001) pole.set(arm ? (side === 'Left' ? 1 : -1) : 0, arm ? -.3 : 0, 1).projectOnPlane(axis)
    return { upper, lower, end, target, rotation: end.getWorldQuaternion(new Quaternion()), pole: pole.normalize(), a: start.distanceTo(middle), b: middle.distanceTo(target) }
  }
  function solve(limb: NonNullable<ReturnType<typeof chain>>, target: Vector3) {
    const { upper, lower, end, a, b, pole } = limb
    const start = at(upper), axis = target.clone().sub(start)
    const distance = Math.max(Math.abs(a - b) + .00001, Math.min(axis.length(), a + b - .00001))
    axis.normalize()
    const along = (a * a - b * b + distance * distance) / (2 * distance)
    const height = Math.sqrt(Math.max(0, a * a - along * along))
    const knee = start.clone().addScaledVector(axis, along).addScaledVector(pole.clone().projectOnPlane(axis).normalize(), height)
    aim(upper, lower, knee)
    aim(lower, end, target)
  }
  return {
    restore() {
      if (!applied) return
      for (const pose of saved) { pose.bone.quaternion.copy(pose.quaternion); pose.bone.position.copy(pose.position) }
      applied = false
    },
    apply(t: number) {
      scene.updateMatrixWorld(true)
      for (const pose of saved) { pose.quaternion.copy(pose.bone.quaternion); pose.position.copy(pose.bone.position) }
      applied = true
      const smooth = (a: number, b: number, value: number) => { const x = Math.max(0, Math.min(1, (value - a) / (b - a))); return x * x * (3 - 2 * x) }
      const settle = 1 - smooth(.65, 1, t)
      const spring = (delay: number, frequency: number, damping: number) => {
        const seconds = Math.max(0, t * 2.6 - delay)
        return Math.sin(seconds * frequency * Math.PI * 2) * Math.exp(-seconds * damping) * smooth(0, .07, seconds) * settle
      }
      const recoil = smooth(0, .065, t) * (1 - smooth(.1, .32, t))
      const brace = smooth(.025, .13, t) * (1 - smooth(.28, .83, t))
      const body = spring(.035, 1.7, 2.1), head = spring(0, 2.3, 1.8), follow = spring(.12, 1.65, 2.3)
      const legs = ['Left', 'Right'].map(side => chain(side, false)).filter(limb => limb !== null)
      const arms = ['Left', 'Right'].map(side => chain(side, true))
      const hips = rig.get('Hips')
      if (hips?.parent) {
        const position = at(hips).add(new Vector3(.015 * body, -.033 * recoil - .009 * brace, -.018 * recoil))
        hips.position.copy(hips.parent.worldToLocal(position))
        hips.updateWorldMatrix(false, true)
      }
      rotate('Hips', -.018 * recoil, .015 * body, .018 * body)
      rotate('Spine2', -.075 * recoil + .025 * follow, .035 * body, -.055 * body)
      rotate('Neck', .025 * recoil, -.035 * body, .025 * follow)
      rotate('Head', -.055 * recoil + .045 * follow, .23 * head, .19 * spring(.065, 2.1, 2))
      for (const [index, side, sign] of [[0, 'Left', 1], [1, 'Right', -1]] as const) {
        const arm = arms[index]
        if (!arm) continue
        const lift = brace * (index === 0 ? 1 : .65)
        rotate(`${side}Shoulder`, -.025 * recoil, 0, sign * .035 * lift)
        // Wrist targets lead the hands into a brief brace; the elbow follows anatomically.
        const target = at(arm.end).add(new Vector3(-sign * .045 * lift + .012 * follow, .24 * lift, .15 * lift + .025 * follow))
        solve(arm, target)
        arm.end.quaternion.copy(arm.end.parent!.getWorldQuaternion(new Quaternion()).invert().multiply(arm.rotation))
        rotate(`${side}Hand`, .06 * spring(.18, 1.8, 2.4), .035 * lift, sign * .045 * follow)
      }
      // Resolve both knees toward the camera while keeping each shoe planted.
      for (const leg of legs) {
        solve(leg, leg.target)
        leg.end.quaternion.copy(leg.end.parent!.getWorldQuaternion(new Quaternion()).invert().multiply(leg.rotation))
        leg.end.updateWorldMatrix(false, true)
      }
    },
  }
}
