import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { loadImage } from '@napi-rs/canvas'
import { AnimationMixer, Box3, LoopOnce, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { validateBytes } from 'gltf-validator'

globalThis.self = globalThis
globalThis.createImageBitmap = async (blob) => loadImage(Buffer.from(await blob.arrayBuffer()))
const bytes = await readFile(new URL('../public/models/ch38-avatar-v2.glb', import.meta.url))
const report = await validateBytes(new Uint8Array(bytes), { maxIssues: 200 })
assert.equal(report.issues.numErrors, 0)
assert.ok(report.issues.messages.every((message) => message.code === 'NODE_SKINNED_MESH_NON_ROOT'), 'Only the known normalization-parent warnings are expected')
const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
gltf.scene.updateMatrixWorld(true)
const bounds = new Box3().setFromObject(gltf.scene)
const height = bounds.getSize(new Vector3()).y
assert.ok(Math.abs(height - 2.35) < .05, `Unexpected normalized height: ${height}`)
assert.ok(Math.abs(bounds.min.y) < .05, 'The avatar must stand on the ground')
const hand = gltf.scene.getObjectByName('mixamorig5RightHand')
assert.ok(hand?.isBone)
const baseline = hand.getWorldPosition(new Vector3()).clone()
const mixer = new AnimationMixer(gltf.scene)
assert.deepEqual(gltf.animations.map((clip) => clip.name).sort(), ['Blink', 'Idle', 'LookAround', 'Nod', 'Sleep', 'Wave', 'Work'])
const wave = mixer.clipAction(gltf.animations.find((clip) => clip.name === 'Wave')).setLoop(LoopOnce, 1).play()
mixer.update(1.5)
gltf.scene.updateMatrixWorld(true)
const raised = hand.getWorldPosition(new Vector3()).clone()
assert.ok(raised.y - baseline.y > .5, 'The exported Wave animation must raise the hand')
const shoulder = gltf.scene.getObjectByName('mixamorig5RightArm').getWorldPosition(new Vector3())
const elbow = gltf.scene.getObjectByName('mixamorig5RightForeArm').getWorldPosition(new Vector3())
const elbowAngle = shoulder.clone().sub(elbow).angleTo(raised.clone().sub(elbow))*180/Math.PI
assert.ok(elbow.y < shoulder.y, 'A greeting should keep the elbow below the shoulder')
assert.ok(elbowAngle > 50 && elbowAngle < 115, `Elbow should be visibly bent, not a straight-arm swing: ${elbowAngle}`)
const middle = gltf.scene.getObjectByName('mixamorig5RightHandMiddle1').getWorldPosition(new Vector3())
const index = gltf.scene.getObjectByName('mixamorig5RightHandIndex1').getWorldPosition(new Vector3())
const pinky = gltf.scene.getObjectByName('mixamorig5RightHandPinky1').getWorldPosition(new Vector3())
const fingerUp = middle.sub(raised).normalize()
const palmNormal = index.sub(raised).cross(pinky.sub(raised)).normalize()
assert.ok(fingerUp.y > .88, 'Waving fingers should point up')
assert.ok(palmNormal.z > .85, 'The waving palm should face the viewer rather than twist sideways')
mixer.update(wave.getClip().duration - 1.5 + .2)
gltf.scene.updateMatrixWorld(true)
assert.ok(hand.getWorldPosition(new Vector3()).distanceTo(baseline) < .001, 'Wave must return to rest')
wave.stop()
const spine = gltf.scene.getObjectByName('mixamorig5Spine2')
const restSpine = spine.quaternion.clone()
const idle = mixer.clipAction(gltf.animations.find((clip) => clip.name === 'Idle')).play()
mixer.update(1)
assert.ok(spine.quaternion.angleTo(restSpine) > .005, 'Idle must animate the imported rig')
idle.stop()
const face = gltf.scene.getObjectByName('Ch38_Body')
const eyelashes = gltf.scene.getObjectByName('Ch38_Eyelashes')
for (const mesh of [face, eyelashes]) {
  assert.equal(mesh.morphTargetDictionary.Blink, 0, 'Blink shape must be exported on face and eyelashes')
  assert.equal(mesh.geometry.morphAttributes.position[0].count, mesh.geometry.attributes.position.count)
}
const blink = mixer.clipAction(gltf.animations.find((clip) => clip.name === 'Blink')).setLoop(LoopOnce, 1).play()
mixer.update(.085)
for (const mesh of [face, eyelashes]) assert.ok(mesh.morphTargetInfluences[0] > .99, 'Blink must close both eyelid surfaces')
mixer.update(.2)
for (const mesh of [face, eyelashes]) assert.ok(mesh.morphTargetInfluences[0] < .001, 'Blink must reopen the eyes')
blink.stop()
assert.ok(idle.getClip().tracks.some((track) => /Hips.*position/.test(track.name)), 'Idle must shift the pelvis')
assert.ok(idle.getClip().tracks.some((track) => /Leg.*quaternion/.test(track.name)), 'Idle must animate the legs')
gltf.scene.updateMatrixWorld(true)
const bones = []
gltf.scene.traverse((node) => { if (node.isBone) bones.push(node) })
const rest = bones.map((bone) => bone.quaternion.clone())
const feet = ['mixamorig5LeftFoot','mixamorig5RightFoot'].map((name) => gltf.scene.getObjectByName(name))
const footPositions = feet.map((foot) => foot.getWorldPosition(new Vector3()).clone())
const hips = gltf.scene.getObjectByName('mixamorig5Hips')
const standingHipHeight = hips.getWorldPosition(new Vector3()).y
let maxAngularSpeed = 0
let maxKneeMotion = 0
let maxHandTravel = 0
const rightKnee = gltf.scene.getObjectByName('mixamorig5RightLeg')
const kneeRest = rightKnee.quaternion.clone()
for (const clip of gltf.animations) {
  const action = mixer.clipAction(clip).reset().setLoop(LoopOnce, 1).play()
  mixer.update(0)
  gltf.scene.updateMatrixWorld(true)
  const clipFootPositions = feet.map((foot) => foot.getWorldPosition(new Vector3()).clone())
  if (clip.name === 'Work') {
    assert.ok(standingHipHeight-hips.getWorldPosition(new Vector3()).y > .35, 'Working pose must sit down')
    for (const [index,position] of clipFootPositions.entries()) assert.ok(Math.abs(position.y-footPositions[index].y) < .001, 'Seated shoes must remain on the ground')
  }
  if (clip.name === 'Sleep') {
    const head = gltf.scene.getObjectByName('mixamorig5Head').getWorldPosition(new Vector3())
    const foot = feet[0].getWorldPosition(new Vector3())
    assert.ok(Math.abs(head.y-foot.y) < .35, 'Sleeping character should lie horizontally')
    assert.ok(Math.abs(head.z-foot.z) > 1.6, 'Sleeping character should extend along the bed')
    assert.ok(head.y > .6 && head.y < 1, 'Head should rest near the pillow')
  }
  const frames = Math.round(clip.duration*60)
  const dt = clip.duration/frames
  let previous = bones.map((bone) => bone.quaternion.clone())
  for (let frame = 0; frame < frames; frame++) {
    mixer.update(dt)
    gltf.scene.updateMatrixWorld(true)
    if (clip.name === 'Idle') {
      maxKneeMotion = Math.max(maxKneeMotion, rightKnee.quaternion.angleTo(kneeRest))
      maxHandTravel = Math.max(maxHandTravel, hand.getWorldPosition(new Vector3()).distanceTo(baseline))
    }
    if (clip.name === 'Work') {
      for (const side of ['Left','Right']) {
        const wrist = gltf.scene.getObjectByName(`mixamorig5${side}Hand`).getWorldPosition(new Vector3())
        assert.ok(wrist.y > 1.04 && wrist.y < 1.13, 'Typing hands must stay above the desk')
        assert.ok(wrist.z > .1 && wrist.z < .32, 'Typing hands must stay over the keyboard')
      }
    }
    if (clip.name === 'Sleep') {
      for (const mesh of [face,eyelashes]) assert.ok(mesh.morphTargetInfluences[0] > .99, 'Sleeping eyes must stay closed')
    }
    if (clip.name === 'Wave' && frame*dt > 1.3 && frame*dt < 2.8) {
      const wrist = hand.getWorldPosition(new Vector3())
      const elbowPosition = gltf.scene.getObjectByName('mixamorig5RightForeArm').getWorldPosition(new Vector3())
      const shoulderPosition = gltf.scene.getObjectByName('mixamorig5RightArm').getWorldPosition(new Vector3())
      const bend = shoulderPosition.clone().sub(elbowPosition).angleTo(wrist.clone().sub(elbowPosition))*180/Math.PI
      const middlePosition = gltf.scene.getObjectByName('mixamorig5RightHandMiddle1').getWorldPosition(new Vector3())
      const indexPosition = gltf.scene.getObjectByName('mixamorig5RightHandIndex1').getWorldPosition(new Vector3())
      const pinkyPosition = gltf.scene.getObjectByName('mixamorig5RightHandPinky1').getWorldPosition(new Vector3())
      assert.ok(bend > 50 && bend < 115, 'Elbow must remain bent throughout the greeting')
      assert.ok(middlePosition.sub(wrist).normalize().y > .88, 'Fingers must remain upright throughout the wrist sweep')
      assert.ok(indexPosition.sub(wrist).cross(pinkyPosition.sub(wrist)).normalize().z > .85, 'Palm must remain forward throughout the wrist sweep')
    }
    for (const [index, bone] of bones.entries()) {
      assert.ok(bone.quaternion.toArray().every(Number.isFinite))
      const speed = bone.quaternion.angleTo(previous[index])/dt
      maxAngularSpeed = Math.max(maxAngularSpeed, speed)
      assert.ok(speed < 6.5, `${clip.name}: sudden joint rotation on ${bone.name}`)
    }
    for (const [index, foot] of feet.entries()) assert.ok(foot.getWorldPosition(new Vector3()).distanceTo(clipFootPositions[index]) < .001, `${clip.name}: foot sliding`)
    previous = bones.map((bone) => bone.quaternion.clone())
  }
  mixer.update(.1)
  action.stop()
  for (const [index,bone] of bones.entries()) assert.ok(bone.quaternion.angleTo(rest[index]) < .001, `${clip.name}: did not return to resting pose`)
}
let meshes = 0
assert.ok(maxKneeMotion > .08, 'Idle should visibly shift through the knees')
assert.ok(maxHandTravel > .02, 'Idle should move the hands naturally with the body')
const images = new Set()
gltf.scene.traverse((node) => {
  if (!node.isSkinnedMesh) return
  meshes++
  assert.ok(node.skeleton.bones.every((bone) => bone?.isBone))
  if (node.material.map) images.add(node.material.map.image)
})
assert.equal(meshes, 7)
assert.equal(images.size, 2, 'Both supplied color textures must survive conversion')
for (const image of images) assert.ok(image.width <= 1024 && image.height <= 1024)
console.log(JSON.stringify({ errors: report.issues.numErrors, warnings: report.issues.numWarnings, elbowAngle: elbowAngle.toFixed(1), palmFacingForward: palmNormal.z.toFixed(2), fingersUp: fingerUp.y.toFixed(2), skinnedMeshes: meshes, colorTextures: images.size, heightMetres: height.toFixed(2), waveLiftMetres: (raised.y-baseline.y).toFixed(2), idleKneeMotionDegrees: (maxKneeMotion*180/Math.PI).toFixed(1), idleHandTravelMetres: maxHandTravel.toFixed(3), clips: gltf.animations.map((clip) => clip.name), maxAngularSpeed: maxAngularSpeed.toFixed(2), plantedFeet: true, allClipsReturnToRest: true }))
