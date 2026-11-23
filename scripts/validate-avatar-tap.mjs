import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { loadImage } from '@napi-rs/canvas'
import { AnimationMixer, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { createAvatarTapPose } from '../src/features/dashboard/presentation/components/avatarTapPose.ts'

globalThis.self = globalThis
globalThis.createImageBitmap = async blob => loadImage(Buffer.from(await blob.arrayBuffer()))
const bytes = await readFile(new URL('../public/models/ch38-avatar-v2.glb', import.meta.url))
const { scene, animations } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
const mixer = new AnimationMixer(scene)
mixer.clipAction(animations.find(clip => clip.name === 'Idle')).play()
mixer.update(.5)
scene.updateMatrixWorld(true)
const bones = []
scene.traverse(node => { if (node.isBone) bones.push(node) })
const rest = bones.map(bone => ({ q: bone.quaternion.clone(), p: bone.position.clone() }))
const feet = ['Left', 'Right'].map(side => scene.getObjectByName(`mixamorig5${side}Foot`))
const targets = feet.map(foot => foot.getWorldPosition(new Vector3()))
const maxima = new Map()
const pose = createAvatarTapPose(scene)
let slip = 0
let maxSpeed = 0
let previous = null
for (let frame = 0; frame <= 156; frame++) {
  pose.restore()
  pose.apply(frame / 156)
  scene.updateMatrixWorld(true)
  feet.forEach((foot, i) => { slip = Math.max(slip, foot.getWorldPosition(new Vector3()).distanceTo(targets[i])) })
  bones.forEach((bone, i) => {
    assert.ok(bone.quaternion.toArray().every(Number.isFinite), bone.name)
    maxima.set(bone.name, Math.max(maxima.get(bone.name) ?? 0, bone.quaternion.angleTo(rest[i].q)))
    if (previous) maxSpeed = Math.max(maxSpeed, bone.quaternion.angleTo(previous[i]) * 60)
  })
  previous = bones.map(bone => bone.quaternion.clone())
}
pose.restore()
for (const name of ['Head', 'Spine2', 'LeftArm', 'RightArm', 'LeftForeArm', 'RightHand', 'LeftLeg', 'RightLeg']) {
  const angle = maxima.get(`mixamorig5${name}`) ?? 0
  assert.ok(angle > .025, `${name} must visibly react: ${angle}`)
}
assert.ok(slip < .001, `Feet should remain planted: ${slip}m`)
assert.ok(maxSpeed < 15, `Joint movement must stay continuous: ${maxSpeed}rad/s`)
bones.forEach((bone, i) => {
  assert.ok(bone.quaternion.angleTo(rest[i].q) < .000001, `${bone.name} must restore rotation`)
  assert.ok(bone.position.distanceTo(rest[i].p) < .000001, `${bone.name} must restore position`)
})
console.log(`Full-body reaction verified across 157 poses. Maximum foot slip: ${(slip * 1000).toFixed(3)}mm. Maximum joint speed: ${maxSpeed.toFixed(2)}rad/s. All joints restore.`)
