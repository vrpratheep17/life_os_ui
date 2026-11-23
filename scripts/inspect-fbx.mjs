import { readFile } from 'node:fs/promises'
import { Box3, Texture, TextureLoader, Vector3 } from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'

globalThis.window = { URL }
const textures = []
TextureLoader.prototype.load = function (url) {
  textures.push(url.startsWith('data:') ? url.slice(0, 80) : url)
  return new Texture()
}
const bytes = await readFile(new URL('../public/models/Ch38_nonPBR.fbx', import.meta.url))
const model = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
model.updateMatrixWorld(true)
const bones = []
const meshes = []
model.traverse((node) => {
  if (node.isBone) bones.push({ name: node.name, position: node.getWorldPosition(new Vector3()).toArray() })
  if (node.isMesh) meshes.push({ name: node.name, vertices: node.geometry.attributes.position.count, skinned: !!node.isSkinnedMesh, materials: (Array.isArray(node.material) ? node.material : [node.material]).map((m) => ({name:m.name,type:m.type,color:m.color?.getHexString(),map:!!m.map})) })
})
console.log(JSON.stringify({bounds:{min:new Box3().setFromObject(model).min.toArray(),max:new Box3().setFromObject(model).max.toArray()},bones,meshes,animations:model.animations.map((clip)=>({name:clip.name,duration:clip.duration,tracks:clip.tracks.length})),textures},null,2))
