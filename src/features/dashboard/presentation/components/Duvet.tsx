import { useEffect, useMemo } from 'react'
import { BufferGeometry, CatmullRomCurve3, DataTexture, DoubleSide, Float32BufferAttribute, RepeatWrapping, RGBAFormat, TubeGeometry, Vector3 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

const smooth = (value: number) => { const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t) }
function fabricHeight(x: number,z: number) {
  const side=smooth((Math.abs(x)-.46)/.3)
  const foot=smooth((z-1.15)/.29)
  const body=.13*Math.exp(-Math.pow(x/.44,4))
  const folds=.009*Math.sin(23*x+2.5*z)+.005*Math.sin(14*z-7*x)
  const drapeFolds=.016*Math.sin(z*21+Math.abs(x)*7)*side
  const quilting=.003*Math.pow(Math.sin(Math.PI*x/.21)*Math.sin(Math.PI*(z-.07)/.25),2)
  return .91+body-.25*side-.25*foot*(1-.35*side)+folds+drapeFolds+quilting
}
function cloth(zStart: number,zEnd: number,fold=false) {
  const geometry=new BufferGeometry()
  const vertices:number[]=[],uv:number[]=[],indices:number[]=[]
  const columns=72,rows=fold?14:84
  for(let row=0;row<=rows;row++)for(let column=0;column<=columns;column++) {
    const u=column/columns,v=row/rows,x=(u-.5)*1.52,z=zStart+v*(zEnd-zStart)
    const y=fabricHeight(x,z)+(fold?.012+.026*Math.sin(Math.PI*v):0)
    vertices.push(x,y,z)
    uv.push(u,(z+.05)/1.5)
  }
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++) {
    const a=row*(columns+1)+column,b=a+1,c=a+columns+1,d=c+1
    indices.push(a,c,b,b,c,d)
  }
  geometry.setAttribute('position',new Float32BufferAttribute(vertices,3))
  geometry.setAttribute('uv',new Float32BufferAttribute(uv,2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
function stitch(points: Vector3[]) {
  return new TubeGeometry(new CatmullRomCurve3(points),points.length*2,.0013,4,false)
}

export default function Duvet() {
  const assets=useMemo(()=>{
    const lines:BufferGeometry[]=[]
    for(const x of [-.42,-.21,0,.21,.42]) lines.push(stitch(Array.from({length:55},(_,i)=>{
      const z=.16+i/54*1.22;return new Vector3(x,fabricHeight(x,z)+.002,z)
    })))
    for(const z of [.32,.57,.82,1.07,1.32]) lines.push(stitch(Array.from({length:55},(_,i)=>{
      const x=-.75+i/54*1.5;return new Vector3(x,fabricHeight(x,z)+.002,z)
    })))
    const seams=mergeGeometries(lines)
    lines.forEach(line=>line.dispose())
    const pixels=new Uint8Array(64*64*4)
    for(let y=0;y<64;y++)for(let x=0;x<64;x++) {
      const value=128+((x%4<2)===(y%4<2)?25:-25)
      const index=(y*64+x)*4
      pixels.set([value,value,value,255],index)
    }
    const weave=new DataTexture(pixels,64,64,RGBAFormat)
    weave.wrapS=weave.wrapT=RepeatWrapping
    weave.repeat.set(18,20)
    weave.needsUpdate=true
    return {surface:cloth(-.05,1.44),fold:cloth(-.045,.16,true),seams,weave}
  },[])
  useEffect(()=>()=>{assets.surface.dispose();assets.fold.dispose();assets.seams?.dispose();assets.weave.dispose()},[assets])
  return <group>
    <mesh geometry={assets.surface} castShadow receiveShadow>
      <meshPhysicalMaterial color="#416d91" roughness={.98} sheen={.7} sheenRoughness={1} sheenColor="#98b6cb" bumpMap={assets.weave} bumpScale={.00035} side={DoubleSide}/>
    </mesh>
    <mesh geometry={assets.fold} castShadow receiveShadow>
      <meshPhysicalMaterial color="#8eafc3" roughness={1} sheen={.5} sheenRoughness={1} bumpMap={assets.weave} bumpScale={.0003} side={DoubleSide}/>
    </mesh>
    {assets.seams && <mesh geometry={assets.seams}><meshStandardMaterial color="#345673" roughness={1}/></mesh>}
  </group>
}
