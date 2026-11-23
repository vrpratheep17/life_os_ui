import { mkdir, writeFile } from 'node:fs/promises'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js'

// GLTFExporter uses FileReader for its binary buffer, even without textures.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer
      this.onloadend?.()
    }).catch((error) => this.onerror?.(error))
  }
}

const model = new THREE.Scene()
model.name = 'LifeOS_Avatar'
const bones = []
const locations = new Map()
function bone(name, parent, position) {
  const joint = new THREE.Bone()
  joint.name = name
  const world = new THREE.Vector3(...position)
  joint.position.copy(world).sub(parent ? locations.get(parent.name) : new THREE.Vector3())
  if (parent) parent.add(joint)
  else model.add(joint)
  locations.set(name, world)
  bones.push(joint)
  return joint
}
const hips = bone('Hips', null, [0, 1, 0])
const spine = bone('Spine', hips, [0, 1.22, 0])
const chest = bone('Chest', spine, [0, 1.45, 0])
const neck = bone('Neck', chest, [0, 1.66, 0])
const head = bone('Head', neck, [0, 1.98, 0])
const limbs = {}
for (const [side, sign] of [['Left', 1], ['Right', -1]]) {
  const upperArm = bone(`${side}UpperArm`, chest, [sign * .32, 1.49, 0])
  const forearm = bone(`${side}Forearm`, upperArm, [sign * .43, 1.19, .005])
  const hand = bone(`${side}Hand`, forearm, [sign * .47, .94, .03])
  const thigh = bone(`${side}Thigh`, hips, [sign * .135, .98, 0])
  const shin = bone(`${side}Shin`, thigh, [sign * .145, .57, 0])
  const foot = bone(`${side}Foot`, shin, [sign * .15, .14, .03])
  limbs[side] = { upperArm, forearm, hand, thigh, shin, foot, sign }
}
model.updateMatrixWorld(true)
const skeleton = new THREE.Skeleton(bones)
const materials = {
  skin: new THREE.MeshStandardMaterial({ color: '#b87950', roughness: .72 }),
  ear: new THREE.MeshStandardMaterial({ color: '#a96348', roughness: .8 }),
  blue: new THREE.MeshStandardMaterial({ color: '#063c91', roughness: .83 }),
  seam: new THREE.MeshStandardMaterial({ color: '#092b66', roughness: .9 }),
  shirt: new THREE.MeshStandardMaterial({ color: '#f6f8ff', roughness: .92 }),
  pants: new THREE.MeshStandardMaterial({ color: '#c5bda9', roughness: .95 }),
  shoe: new THREE.MeshStandardMaterial({ color: '#f6f7fa', roughness: .65 }),
  sole: new THREE.MeshStandardMaterial({ color: '#dce3ed', roughness: .85 }),
  hair: new THREE.MeshStandardMaterial({ color: '#241c1b', roughness: .86 }),
  white: new THREE.MeshStandardMaterial({ color: '#fffaf0', roughness: .4 }),
  iris: new THREE.MeshStandardMaterial({ color: '#563625', roughness: .4 }),
  pupil: new THREE.MeshStandardMaterial({ color: '#151518', roughness: .3 }),
  mouth: new THREE.MeshStandardMaterial({ color: '#703f33', roughness: .8 }),
  button: new THREE.MeshStandardMaterial({ color: '#aab9d0', metalness: .3, roughness: .4 }),
}
const parts = new Map()
function add(geometry, joint, material, position, scale = [1, 1, 1], rotation = new THREE.Quaternion()) {
  geometry.deleteAttribute('uv')
  geometry.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...position), rotation, new THREE.Vector3(...scale)))
  const count = geometry.attributes.position.count
  const indices = new Uint16Array(count * 4)
  const weights = new Float32Array(count * 4)
  for (let index = 0; index < count; index++) {
    indices[index * 4] = bones.indexOf(joint)
    weights[index * 4] = 1
  }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4))
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4))
  if (!parts.has(material)) parts.set(material, [])
  parts.get(material).push(geometry)
}
function ellipsoid(joint, material, position, scale) {
  add(new THREE.SphereGeometry(1, 28, 20), joint, material, position, scale)
}
function capsule(joint, material, start, end, radius, depth = 1) {
  const a = new THREE.Vector3(...start)
  const b = new THREE.Vector3(...end)
  const direction = b.clone().sub(a)
  add(new THREE.CapsuleGeometry(radius, direction.length(), 8, 18), joint, material,
    a.add(b).multiplyScalar(.5).toArray(), [1, 1, depth],
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()))
}
function curve(joint, material, points, radius = .01) {
  const path = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)))
  add(new THREE.TubeGeometry(path, 20, radius, 8, false), joint, material, [0, 0, 0])
}

// Soft, rounded proportions, with individually skinned limbs and facial details.
ellipsoid(chest, 'blue', [0, 1.32, 0], [.30, .34, .18])
ellipsoid(chest, 'shirt', [0, 1.35, .157], [.105, .26, .038])
capsule(neck, 'skin', [0, 1.59, 0], [0, 1.75, 0], .09)
ellipsoid(head, 'skin', [0, 1.99, 0], [.285, .335, .255])
for (const sign of [-1, 1]) {
  ellipsoid(head, 'skin', [sign * .281, 1.985, -.005], [.058, .085, .04])
  ellipsoid(head, 'ear', [sign * .296, 1.985, .024], [.027, .049, .014])
  ellipsoid(head, 'white', [sign * .109, 2.023, .229], [.071, .079, .038])
  ellipsoid(head, 'iris', [sign * .104, 2.02, .261], [.039, .046, .015])
  ellipsoid(head, 'pupil', [sign * .102, 2.022, .274], [.021, .029, .008])
  ellipsoid(head, 'white', [sign * .104 - .009, 2.041, .282], [.009, .011, .004])
  curve(head, 'hair', [[sign * .052, 2.125, .23], [sign * .107, 2.143, .232], [sign * .166, 2.127, .201]], .014)
}
ellipsoid(head, 'skin', [0, 1.968, .259], [.05, .061, .057])
curve(head, 'mouth', [[-.092, 1.881, .223], [-.046, 1.858, .249], [.015, 1.856, .254], [.085, 1.889, .227]], .009)
// Sculpted hair cap with a swept fringe, rather than a flat painted texture.
add(new THREE.SphereGeometry(1, 32, 20, 0, Math.PI * 2, 0, Math.PI * .53), head, 'hair', [0, 2.065, -.018], [.298, .283, .269])
for (const [x, y, z, size] of [[-.19,2.22,.15,.095],[-.10,2.27,.19,.105],[.015,2.285,.18,.10],[.12,2.26,.14,.09],[.21,2.19,.08,.073],[-.25,2.11,.03,.055]]) {
  ellipsoid(head, 'hair', [x, y, z], [size, size * .74, size * .80])
}
for (const sign of [-1, 1]) {
  capsule(chest, 'seam', [sign * .11, 1.55, .15], [sign * .105, 1.12, .162], .012)
  capsule(chest, 'blue', [sign * .1, 1.58, .145], [sign * .145, 1.48, .17], .035, .5)
  curve(chest, 'seam', [[sign*.16,1.39,.17],[sign*.23,1.39,.14],[sign*.23,1.29,.146],[sign*.16,1.29,.177],[sign*.16,1.39,.17]], .004)
}
for (const y of [1.46,1.33,1.2,1.09]) ellipsoid(chest, 'button', [.105, y, .186], [.012,.012,.006])

for (const { upperArm, forearm, hand, thigh, shin, foot, sign: s } of Object.values(limbs)) {
  capsule(upperArm, 'blue', [s*.32,1.48,0], [s*.423,1.205,.005], .1, .95)
  capsule(forearm, 'blue', [s*.43,1.19,.005], [s*.46,1.015,.02], .083)
  capsule(forearm, 'seam', [s*.46,1.025,.02], [s*.462,1.005,.022], .084)
  capsule(forearm, 'skin', [s*.465,1.005,.025], [s*.47,.945,.03], .06)
  ellipsoid(hand, 'skin', [s*.473,.891,.035], [.066,.085,.037])
  // Rounded separate fingers and thumb, available under the hand joint.
  for (let index=0; index<4; index++) {
    const x = s*(.429 + index*.028)
    capsule(hand, 'skin', [x,.855,.039], [x,.806 + Math.abs(1.5-index)*.009,.043], .014)
  }
  capsule(hand, 'skin', [s*.424,.91,.048], [s*.397,.865,.066], .021)
  capsule(thigh, 'pants', [s*.135,.99,0], [s*.145,.575,.005], .116, .92)
  capsule(shin, 'pants', [s*.145,.57,.005], [s*.15,.20,.02], .09, .95)
  ellipsoid(foot, 'shoe', [s*.15,.105,.09], [.106,.086,.182])
  ellipsoid(foot, 'sole', [s*.15,.057,.095], [.109,.034,.184])
  for (const y of [.14,.16,.18]) {
    curve(foot,'shirt', [[s*.15-.045,y-.01,.19],[s*.15,y,.20],[s*.15+.045,y-.01,.19]],.005)
  }
}

for (const [material, geometries] of parts) {
  const mesh = new THREE.SkinnedMesh(mergeGeometries(geometries), materials[material])
  mesh.name = `Avatar_${material}`
  mesh.castShadow = true
  mesh.receiveShadow = true
  model.add(mesh)
  mesh.bind(skeleton)
}
model.updateMatrixWorld(true)

function rotationTrack(name, times, angles) {
  return new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times,
    angles.flatMap(([x,y,z]) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z)).toArray()))
}
const idle = new THREE.AnimationClip('Idle', 4, [
  rotationTrack('Spine', [0,1,2,3,4], [[0,0,0],[.012,0,.012],[0,0,0],[-.008,0,-.012],[0,0,0]]),
  rotationTrack('Head', [0,1,2,3,4], [[0,0,0],[0,.025,-.012],[0,0,0],[0,-.025,.012],[0,0,0]]),
])
const wave = new THREE.AnimationClip('Wave', 2.6, [
  rotationTrack('RightUpperArm', [0,.45,.75,2.1,2.6], [[0,0,0],[0,0,-2.45],[0,0,-2.45],[0,0,-2.45],[0,0,0]]),
  rotationTrack('RightForearm', [0,.45,.8,1.1,1.4,1.7,2.1,2.6], [[0,0,0],[0,0,-.25],[0,0,-.5],[0,0,.08],[0,0,-.5],[0,0,.08],[0,0,-.25],[0,0,0]]),
  rotationTrack('RightHand', [0,.45,.8,1.1,1.4,1.7,2.1,2.6], [[0,0,0],[0,0,0],[0,0,-.22],[0,0,.22],[0,0,-.22],[0,0,.22],[0,0,0],[0,0,0]]),
])
const output = new URL('../public/models/', import.meta.url)
await mkdir(output, { recursive: true })
const binary = await new GLTFExporter().parseAsync(model, { binary: true, animations: [idle, wave], onlyVisible: true })
await writeFile(new URL('life-os-avatar.glb', output), Buffer.from(binary))
await writeFile(new URL('life-os-avatar.obj', output), new OBJExporter().parse(model))
await writeFile(new URL('life-os-avatar.json', output), JSON.stringify({
  name: model.name,
  license: 'Project-owned procedural artwork; no third-party model assets.',
  generator: 'scripts/generate-avatar.mjs',
  units: 'metres', up: '+Y', forward: '+Z',
  bones: bones.map((joint) => joint.name),
  animations: [{name:'Idle',duration:4,loop:true},{name:'Wave',duration:2.6,loop:false}],
  note: 'Stylized original model. OBJ is a static geometry export; GLB contains materials, skinning, and animation.',
}, null, 2))
console.log(`Generated GLB (${Math.round(binary.byteLength/1024)} KB), static OBJ, ${bones.length} bones, Idle and Wave clips.`)
