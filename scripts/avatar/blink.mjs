import { AnimationClip, Box3, Float32BufferAttribute, NumberKeyframeTrack, Vector3 } from 'three'

// Eyelid shaping for the supplied Ch38 character, in its original centimetres.
// Keep this separate from humanoid motion authoring: facial topology is model-specific.
export function addBlinkMorphTargets(model) {
  const body = model.getObjectByName('Ch38_Body')
  const lashes = model.getObjectByName('Ch38_Eyelashes')
  if (!body || !lashes) throw new Error('Ch38 face meshes are missing')
  const geometry = body.geometry
  const positions = geometry.attributes.position
  const parent = Array.from({length:positions.count}, (_,index)=>index)
  const root = (index) => parent[index]===index ? index : (parent[index]=root(parent[index]))
  const join = (a,b) => { parent[root(a)]=root(b) }
  const seen = new Map()
  for(let index=0;index<positions.count;index++) {
    const key=[positions.getX(index),positions.getY(index),positions.getZ(index)].map(value=>value.toFixed(3)).join(',')
    if(seen.has(key)) join(index,seen.get(key))
    else seen.set(key,index)
  }
  const indices=geometry.index
  const count=indices?indices.count:positions.count
  for(let index=0;index<count;index+=3) {
    const a=indices?indices.getX(index):index
    join(a,indices?indices.getX(index+1):index+1)
    join(a,indices?indices.getX(index+2):index+2)
  }
  const components=new Map()
  for(let index=0;index<positions.count;index++) {
    const key=root(index)
    if(!components.has(key))components.set(key,new Box3())
    components.get(key).expandByPoint(new Vector3().fromBufferAttribute(positions,index))
  }
  const eyeComponents = new Set([...components].filter(([,box]) => box.min.y>163 && box.max.y<167 && box.max.x-box.min.x<4 && Math.abs(box.getCenter(new Vector3()).x)>1).map(([key])=>key))
  if(eyeComponents.size!==2) throw new Error(`Expected two separate eyeballs, got ${eyeComponents.size}`)
  const smooth = (a,b,value) => { const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t) }
  const tracks=[]
  for(const mesh of [body,lashes]) {
    const source=mesh.geometry.attributes.position
    const target=new Float32Array(source.array)
    for(let index=0;index<source.count;index++) {
      const x=source.getX(index),y=source.getY(index),z=source.getZ(index)
      const seam=164.72+.02*(Math.abs(x)-3.15)
      if(mesh===body && eyeComponents.has(root(index))) {
        target[index*3+1]=seam+(y-164.95)*.035
        target[index*3+2]=z-.25
      } else if(mesh===lashes) {
        target[index*3+1]=seam+(y-164.95)*.055
        target[index*3+2]=z+.08
      } else if(mesh===body) {
        const ax=Math.abs(x)
        const weight=smooth(.7,1.5,ax)*(1-smooth(4.8,5.9,ax))*smooth(163.5,164.25,y)*(1-smooth(165.2,166.25,y))*smooth(9.4,10.6,z)
        target[index*3+1]=y+(seam-y)*weight
        target[index*3+2]=z+.12*weight
      }
    }
    const attribute=new Float32BufferAttribute(target,3)
    attribute.name='Blink'
    const closed=mesh.geometry.clone()
    closed.setAttribute('position',attribute)
    closed.computeVertexNormals()
    mesh.geometry.morphTargetsRelative=false
    mesh.geometry.morphAttributes.position=[attribute]
    mesh.geometry.morphAttributes.normal=[closed.attributes.normal.clone()]
    mesh.updateMorphTargets()
    tracks.push(new NumberKeyframeTrack(`${mesh.uuid}.morphTargetInfluences[Blink]`,[0,.045,.085,.115,.22],[0,.65,1,.85,0]))
  }
  return new AnimationClip('Blink',.22,tracks)
}
