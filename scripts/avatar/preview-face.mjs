import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { Texture, TextureLoader, Vector3 } from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { addBlinkMorphTargets } from './blink.mjs'

globalThis.window = { URL }
const pending = []
TextureLoader.prototype.load = function(url) {
  const texture = new Texture()
  pending.push((async () => {
    texture.image = await loadImage(Buffer.from(await (await fetch(url)).arrayBuffer()))
  })())
  return texture
}
const bytes = await readFile(new URL('../../public/models/Ch38_nonPBR.fbx',import.meta.url))
const model = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')
await Promise.all(pending)
model.updateMatrixWorld(true)
const closed = process.argv.includes('--closed')
if(closed) addBlinkMorphTargets(model)
const size = 900
const canvas = createCanvas(size,size)
const context = canvas.getContext('2d')
const image = context.createImageData(size,size)
const depth = new Float32Array(size*size).fill(-Infinity)
const textures = new Map()
function texturePixels(material) {
  if (textures.has(material)) return textures.get(material)
  if (!material.map?.image) return null
  const source = material.map.image
  const c = createCanvas(source.width,source.height)
  c.getContext('2d').drawImage(source,0,0)
  const pixels = {width:source.width,height:source.height,data:c.getContext('2d').getImageData(0,0,source.width,source.height).data}
  textures.set(material,pixels)
  return pixels
}
for (const node of model.children) {
  if (!node.isMesh || !/Body|Eyelashes|Hair/.test(node.name)) continue
  const geometry = node.geometry
  const p = closed && geometry.morphAttributes.position?.[0] ? geometry.morphAttributes.position[0] : geometry.attributes.position
  const uv = geometry.attributes.uv
  const index = geometry.index
  const material = node.material
  const texture = texturePixels(material)
  const count = index ? index.count : p.count
  for (let face=0;face<count;face+=3) {
    const ids = [0,1,2].map(i => index ? index.getX(face+i) : face+i)
    const world = ids.map(i => new Vector3().fromBufferAttribute(p,i).applyMatrix4(node.matrixWorld))
    if (world.some(v => v.y<154 || Math.abs(v.x)>12)) continue
    const points = world.map(v=>({x:(v.x+11)/22*size,y:(178-v.y)/24*size,z:v.z}))
    const [a,b,c] = points
    const determinant = (b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y)
    if (Math.abs(determinant)<.001) continue
    const minX=Math.max(0,Math.floor(Math.min(...points.map(v=>v.x))))
    const maxX=Math.min(size-1,Math.ceil(Math.max(...points.map(v=>v.x))))
    const minY=Math.max(0,Math.floor(Math.min(...points.map(v=>v.y))))
    const maxY=Math.min(size-1,Math.ceil(Math.max(...points.map(v=>v.y))))
    for(let y=minY;y<=maxY;y++) for(let x=minX;x<=maxX;x++) {
      const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/determinant
      const v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/determinant
      const w=1-u-v
      if(u<0||v<0||w<0) continue
      const z=u*a.z+v*b.z+w*c.z
      const pixel=y*size+x
      if(z<=depth[pixel]) continue
      let color=[190,140,110,255]
      if(texture) {
        const tx=Math.max(0,Math.min(texture.width-1,Math.floor((u*uv.getX(ids[0])+v*uv.getX(ids[1])+w*uv.getX(ids[2]))*texture.width)))
        let ty=u*uv.getY(ids[0])+v*uv.getY(ids[1])+w*uv.getY(ids[2])
        if(material.map.flipY)ty=1-ty
        ty=Math.max(0,Math.min(texture.height-1,Math.floor(ty*texture.height)))
        const offset=(ty*texture.width+tx)*4
        color=texture.data.subarray(offset,offset+4)
        if(color[3]<100) continue
      }
      depth[pixel]=z
      image.data.set(color,pixel*4)
    }
  }
}
context.fillStyle='#142941'
context.fillRect(0,0,size,size)
const overlay=createCanvas(size,size)
overlay.getContext('2d').putImageData(image,0,0)
context.drawImage(overlay,0,0)
await mkdir(new URL('../../tmp/',import.meta.url),{recursive:true})
await writeFile(new URL(`../../tmp/avatar-face-${closed?'closed':'open'}.png`,import.meta.url),canvas.toBuffer('image/png'))
console.log(`Rendered face preview: tmp/avatar-face-${closed?'closed':'open'}.png`)
