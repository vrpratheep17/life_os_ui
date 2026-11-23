import { readFile, writeFile } from 'node:fs/promises'
import { createCanvas, loadImage, Image, ImageData } from '@napi-rs/canvas'
import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { computeMikkTSpaceTangents, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import * as MikkTSpace from 'three/addons/libs/mikktspace.module.js'
import { validateBytes } from 'gltf-validator'
import { authorAvatarMotions } from './avatar/motions.mjs'
import { addBlinkMorphTargets } from './avatar/blink.mjs'
import { authorSleepClip } from './avatar/sleep.mjs'

// Provide image decoding for the FBX's embedded PNGs during offline conversion.
globalThis.window = { URL }
globalThis.HTMLImageElement = Image
globalThis.ImageData = ImageData
globalThis.HTMLCanvasElement = createCanvas(1, 1).constructor
globalThis.document = {
  createElement(type) {
    if (type !== 'canvas') throw new Error(`Unsupported element: ${type}`)
    const canvas = createCanvas(1, 1)
    canvas.toBlob = (callback, mime = 'image/png') => callback(new Blob([canvas.toBuffer(mime)], { type: mime }))
    return canvas
  },
}
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((buffer) => { this.result = buffer; this.onloadend?.() }).catch((error) => this.onerror?.(error)) }
}
const pending = []
const blobs = []
THREE.TextureLoader.prototype.load = function(url) {
  const texture = new THREE.Texture()
  pending.push((async () => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Could not read texture: ${url}`)
    texture.image = await loadImage(Buffer.from(await response.arrayBuffer()))
    texture.needsUpdate = true
    blobs.push(url)
  })())
  return texture
}
const file = new URL('../public/models/Ch38_nonPBR.fbx', import.meta.url)
const input = await readFile(file)
const model = new FBXLoader().parse(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength), '')
await Promise.all(pending)
await MikkTSpace.ready
model.name = 'Imported_Ch38_Avatar'
model.updateMatrixWorld(true)
const skeletonRoot = model.children.find((node) => node.isBone)

// Convert the non-PBR materials while retaining color, alpha, and normal maps.
const materialCache = new Map()
const convertMaterial = (source) => {
  if (materialCache.has(source)) return materialCache.get(source)
  const material = new THREE.MeshStandardMaterial({
    name: source.name,
    color: source.color,
    map: source.map,
    normalMap: source.normalMap,
    normalScale: source.normalScale,
    transparent: source.transparent,
    opacity: source.opacity,
    alphaMap: source.alphaMap,
    alphaTest: source.transparent || /hair/i.test(source.name) ? .15 : source.alphaTest,
    side: source.side,
    roughness: /hair/i.test(source.name) ? .55 : .86,
    metalness: 0,
  })
  materialCache.set(source, material)
  return material
}
const joints = new Map()
model.traverse((node) => {
  if (node.isBone && node.parent?.name !== node.name && !joints.has(node.name)) joints.set(node.name, node)
  if (node.isMesh) {
    node.material = Array.isArray(node.material) ? node.material.map(convertMaterial) : convertMaterial(node.material)
    node.castShadow = true
    node.receiveShadow = true
    if (node.material.normalMap) {
      node.geometry = computeMikkTSpaceTangents(node.geometry, MikkTSpace)
      const tangents = node.geometry.attributes.tangent
      const normals = node.geometry.attributes.normal
      for (let vertex = 0; vertex < tangents.count; vertex++) {
        const tangent = new THREE.Vector3().fromBufferAttribute(tangents, vertex)
        if (tangent.lengthSq() < .5) {
          const normal = new THREE.Vector3().fromBufferAttribute(normals, vertex).normalize()
          tangent.crossVectors(normal, Math.abs(normal.z) < .9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0)).normalize()
          tangents.setXYZW(vertex, tangent.x, tangent.y, tangent.z, 1)
        }
      }
    }
    if (node.isSkinnedMesh) {
      // FBX has per-mesh helper bones; make their common ancestor the first joint.
      const previous = node.skeleton
      const ordered = [skeletonRoot, ...previous.bones.filter((item) => item !== skeletonRoot)]
      const inverses = ordered.map((item) => {
        const index = previous.bones.indexOf(item)
        return index < 0 ? skeletonRoot.matrixWorld.clone().invert() : previous.boneInverses[index]
      })
      const indices = node.geometry.attributes.skinIndex
      for (let vertex = 0; vertex < indices.count; vertex++) {
        for (let slot = 0; slot < 4; slot++) {
          const weight = node.geometry.attributes.skinWeight.getComponent(vertex, slot)
          indices.setComponent(vertex, slot, weight === 0 ? 0 : ordered.indexOf(previous.bones[indices.getComponent(vertex, slot)]))
        }
      }
      node.skeleton = new THREE.Skeleton(ordered, inverses)
    }
    node.geometry = mergeVertices(node.geometry)
  }
})
const { clips, rig } = authorAvatarMotions(model, joints)
clips.push(addBlinkMorphTargets(model))
clips.push(authorSleepClip(model,joints))
const baseline = rig.RightHand.getWorldPosition(new THREE.Vector3()).clone()
const mixer = new THREE.AnimationMixer(model)
const wave = clips.find((clip) => clip.name === 'Wave')
const action = mixer.clipAction(wave).setLoop(THREE.LoopOnce, 1).play()
mixer.update(1.5)
model.updateMatrixWorld(true)
const handLift = rig.RightHand.getWorldPosition(new THREE.Vector3()).y - baseline.y
if (handLift < 35) throw new Error(`Wave does not raise the hand far enough: ${handLift}`)
mixer.update(wave.duration - 1.5 + .2)
model.updateMatrixWorld(true)
if (rig.RightHand.getWorldPosition(new THREE.Vector3()).distanceTo(baseline) > .01) throw new Error('Wave failed to return to rest')
action.stop()
const bounds = new THREE.Box3().setFromObject(model)
const size = bounds.getSize(new THREE.Vector3())
const center = bounds.getCenter(new THREE.Vector3())
const scale = 2.35 / size.y
model.scale.setScalar(scale)
model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale)
model.updateMatrixWorld(true)
const binary = await new GLTFExporter().parseAsync(model, { binary: true, animations: clips, maxTextureSize: 1024 })
const report = await validateBytes(new Uint8Array(binary), { maxIssues: 200 })
if (report.issues.numErrors) throw new Error(JSON.stringify(report.issues.messages.filter((message) => message.severity === 0), null, 2))
await writeFile(new URL('../public/models/ch38-avatar-v2.glb', import.meta.url), Buffer.from(binary))
await writeFile(new URL('../public/models/ch38-avatar-v2.json', import.meta.url), JSON.stringify({ source: 'Ch38_nonPBR.fbx', animations: clips.map((clip) => ({ name: clip.name, duration: clip.duration })), animationOrigin: 'Procedurally authored for the imported skeleton; source contained no usable motion clips.', textureLimit: 1024, height: 2.35, sourceBytes: input.length, runtimeBytes: binary.byteLength, handLift: handLift * scale, validation: {errors:report.issues.numErrors,warnings:report.issues.numWarnings} }, null, 2))
for (const url of blobs) URL.revokeObjectURL(url)
console.log(JSON.stringify({ sourceMB: (input.length/1e6).toFixed(1), runtimeMB: (binary.byteLength/1e6).toFixed(1), clips: clips.map((clip) => clip.name), handLiftMetres: (handLift*scale).toFixed(2), errors: report.issues.numErrors, warnings: report.issues.numWarnings }))
