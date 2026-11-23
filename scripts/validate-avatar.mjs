import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { validateBytes } from 'gltf-validator'
import { AnimationMixer, Box3, LoopOnce, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const bytes = await readFile(new URL('../public/models/life-os-avatar.glb', import.meta.url))
const report = await validateBytes(new Uint8Array(bytes), { maxIssues: 50 })
console.log(`GLB validation: ${report.issues.numErrors} errors, ${report.issues.numWarnings} warnings`)
assert.equal(report.issues.numErrors, 0, JSON.stringify(report.issues.messages, null, 2))
assert.equal(report.issues.numWarnings, 0, JSON.stringify(report.issues.messages, null, 2))

const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
assert.deepEqual(gltf.animations.map((clip) => clip.name).sort(), ['Idle', 'Wave'])
const hand = gltf.scene.getObjectByName('RightHand')
assert.ok(hand?.isBone, 'The exported GLB must retain a real skeleton')
const baseline = hand.getWorldPosition(new Vector3()).clone()
const mixer = new AnimationMixer(gltf.scene)
const wave = mixer.clipAction(gltf.animations.find((clip) => clip.name === 'Wave'))
wave.setLoop(LoopOnce, 1).play()
mixer.update(.9)
gltf.scene.updateMatrixWorld(true)
const raised = hand.getWorldPosition(new Vector3())
assert.ok(raised.y > baseline.y + .5, 'Wave must actually raise the hand')
let skinnedMeshes = 0
gltf.scene.traverse((object) => {
  if (!object.isSkinnedMesh) return
  skinnedMeshes++
  assert.equal(object.skeleton.bones.length, 17)
  for (const value of object.geometry.attributes.skinWeight.array) assert.ok(Number.isFinite(value))
})
assert.ok(skinnedMeshes > 0)
mixer.update(2)
gltf.scene.updateMatrixWorld(true)
assert.ok(hand.getWorldPosition(new Vector3()).distanceTo(baseline) < .001, 'Wave must return to rest')
const idle = mixer.clipAction(gltf.animations.find((clip) => clip.name === 'Idle')).play()
mixer.update(1)
gltf.scene.updateMatrixWorld(true)
assert.ok(Math.abs(gltf.scene.getObjectByName('Head').quaternion.y) > .001, 'Idle must animate the rig')
idle.stop()
gltf.scene.updateMatrixWorld(true)
const size = new Box3().setFromObject(gltf.scene).getSize(new Vector3())
assert.ok(size.y > 2 && size.y < 3, 'Model dimensions should be in metres')
console.log(`Loaded ${skinnedMeshes} skinned material groups. Wave lifts hand ${(raised.y - baseline.y).toFixed(2)}m and returns to rest. Idle animates. No external textures required.`)
