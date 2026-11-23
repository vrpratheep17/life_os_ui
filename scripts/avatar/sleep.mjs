import { AnimationClip, NumberKeyframeTrack, Quaternion, QuaternionKeyframeTrack, Vector3, VectorKeyframeTrack } from 'three'

export function authorSleepClip(model,joints) {
  const find=(suffix)=>[...joints.values()].find(node=>node.name.endsWith(suffix))
  const rest=new Map([...joints.values()].map(node=>[node,node.quaternion.clone()]))
  const positions=new Map([...joints.values()].map(node=>[node,node.position.clone()]))
  const at=node=>node.getWorldPosition(new Vector3())
  const aim=(node,child,direction)=>{
    model.updateMatrixWorld(true)
    const delta=new Quaternion().setFromUnitVectors(at(child).sub(at(node)).normalize(),direction.clone().normalize())
    const world=delta.multiply(node.getWorldQuaternion(new Quaternion()))
    node.quaternion.copy(node.parent.getWorldQuaternion(new Quaternion()).invert().multiply(world))
    model.updateMatrixWorld(true)
  }
  model.updateMatrixWorld(true)
  for(const side of ['Left','Right']) {
    const sign=side==='Left'?1:-1
    const arm=find(`${side}Arm`),elbow=find(`${side}ForeArm`),hand=find(`${side}Hand`)
    const target=new Vector3(sign*12,104,11)
    const start=at(arm),a=start.distanceTo(at(elbow)),b=at(elbow).distanceTo(at(hand))
    const axis=target.clone().sub(start),distance=axis.length()
    const along=(a*a-b*b+distance*distance)/(2*distance)
    axis.normalize()
    const pole=new Vector3(sign,0,-.2).projectOnPlane(axis).normalize()
    const bend=start.clone().addScaledVector(axis,along).addScaledVector(pole,Math.sqrt(Math.max(0,a*a-along*along)))
    aim(arm,elbow,bend.sub(start))
    aim(elbow,hand,target.clone().sub(at(elbow)))
    const middle=find(`${side}HandMiddle1`),index=find(`${side}HandIndex1`),pinky=find(`${side}HandPinky1`)
    const fingers=new Vector3(-sign*.16,-.98,.05).normalize()
    aim(hand,middle,fingers)
    const normal=at(index).sub(at(hand)).cross(at(pinky).sub(at(hand))).normalize().multiplyScalar(side==='Right'?1:-1)
    const down=new Vector3(0,0,-1).projectOnPlane(fingers).normalize()
    const angle=Math.atan2(fingers.dot(normal.clone().cross(down)),normal.dot(down))
    const world=new Quaternion().setFromAxisAngle(fingers,angle).multiply(hand.getWorldQuaternion(new Quaternion()))
    hand.quaternion.copy(hand.parent.getWorldQuaternion(new Quaternion()).invert().multiply(world))
    model.updateMatrixWorld(true)
  }
  const hips=find('Hips'),spine=find('Spine2'),head=find('Head')
  const lyingWorld=new Quaternion().setFromAxisAngle(new Vector3(1,0,0),-Math.PI/2).multiply(hips.getWorldQuaternion(new Quaternion()))
  hips.quaternion.copy(hips.parent.getWorldQuaternion(new Quaternion()).invert().multiply(lyingWorld))
  hips.position.set(0,61,positions.get(hips).z)
  head.quaternion.multiply(new Quaternion().setFromAxisAngle(new Vector3(0,1,0),.07))
  const sleeping=new Map([...rest.keys()].map(node=>[node,node.quaternion.clone()]))
  const times=Array.from({length:361},(_,index)=>index/60)
  const tracks=[...sleeping].map(([node,q])=>new QuaternionKeyframeTrack(`${node.uuid}.quaternion`,times,times.flatMap(time=>{
    const breath=Math.sin(Math.PI*2*time/6)
    return (node===spine?q.clone().multiply(new Quaternion().setFromAxisAngle(new Vector3(1,0,0),.006*breath)):q).toArray()
  })))
  tracks.push(new VectorKeyframeTrack(`${hips.uuid}.position`,[0,6],[...hips.position.toArray(),...hips.position.toArray()]))
  for(const name of ['Ch38_Body','Ch38_Eyelashes']) {
    const mesh=model.getObjectByName(name)
    tracks.push(new NumberKeyframeTrack(`${mesh.uuid}.morphTargetInfluences[Blink]`,[0,6],[1,1]))
  }
  for(const [node,q]of rest){node.quaternion.copy(q);node.position.copy(positions.get(node))}
  model.updateMatrixWorld(true)
  return new AnimationClip('Sleep',6,tracks).optimize()
}
