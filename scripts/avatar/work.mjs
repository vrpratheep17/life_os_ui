import { Quaternion, Vector3 } from 'three'

export function authorWorkClip({ model, rig, rest, restPositions, aim, rotate, fingers, sampleClip }) {
  const at = (node) => node.getWorldPosition(new Vector3())
  const limbs = ['Left','Right'].map((side) => {
    const foot=rig[`${side}Foot`]
    return { side, footPosition:at(foot).clone(), footRotation:foot.getWorldQuaternion(new Quaternion()) }
  })
  const joint = (suffix) => [...rest.keys()].find((node) => node.name.endsWith(suffix))
  function solve(upper,lower,end,target,pole) {
    model.updateMatrixWorld(true)
    const start=at(upper)
    const a=start.distanceTo(at(lower)), b=at(lower).distanceTo(at(end))
    const axis=target.clone().sub(start)
    const distance=axis.length()
    if(distance>=a+b) throw new Error(`Desk target exceeds reach: ${upper.name}`)
    axis.normalize()
    const along=(a*a-b*b+distance*distance)/(2*distance)
    const height=Math.sqrt(Math.max(0,a*a-along*along))
    const bend=pole.clone().projectOnPlane(axis).normalize()
    const elbow=start.clone().addScaledVector(axis,along).addScaledVector(bend,height)
    aim(upper,lower,elbow.sub(start))
    aim(lower,end,target.clone().sub(at(lower)))
  }
  const tau=Math.PI*2
  return sampleClip('Work',6,[...rest.keys()],(time)=>{
    for(const [node,value]of rest){node.quaternion.copy(value);node.position.copy(restPositions.get(node))}
    const breath=Math.sin(tau*time/6)
    rig.Hips.position.add(new Vector3(0,-31+.12*breath,-8))
    rig.Spine2.quaternion.copy(rotate(rig.Spine2,.075+.006*breath))
    rig.Neck.quaternion.copy(rotate(rig.Neck,.035))
    rig.Head.quaternion.copy(rotate(rig.Head,.13+.008*breath,.015*Math.sin(tau*time/6)))
    model.updateMatrixWorld(true)
    for(const {side,footPosition,footRotation}of limbs){
      const sign=side==='Left'?1:-1
      const foot=rig[`${side}Foot`]
      const target=footPosition.clone();target.z+=31
      solve(rig[`${side}UpLeg`],rig[`${side}Leg`],foot,target,new Vector3(0,0,1))
      foot.quaternion.copy(foot.parent.getWorldQuaternion(new Quaternion()).invert().multiply(footRotation))
      model.updateMatrixWorld(true)
      const arm=rig[`${side}Arm`],forearm=rig[`${side}ForeArm`],hand=rig[`${side}Hand`]
      const cycle=tau*time+(side==='Left'?0:Math.PI)
      const wrist=new Vector3(sign*13.5,82+.15*Math.sin(cycle),18+.2*Math.sin(cycle/3))
      solve(arm,forearm,hand,wrist,new Vector3(sign,-.25,-.1))
      const middle=joint(`${side}HandMiddle1`)
      const index=joint(`${side}HandIndex1`),pinky=joint(`${side}HandPinky1`)
      const forward=new Vector3(0,-.08,1).normalize()
      aim(hand,middle,forward)
      const normal=at(index).sub(at(hand)).cross(at(pinky).sub(at(hand))).normalize().multiplyScalar(side==='Right'?1:-1)
      const down=new Vector3(0,-1,0).projectOnPlane(forward).normalize()
      const twist=Math.atan2(forward.dot(normal.clone().cross(down)),normal.dot(down))
      const world=new Quaternion().setFromAxisAngle(forward,twist).multiply(hand.getWorldQuaternion(new Quaternion()))
      hand.quaternion.copy(hand.parent.getWorldQuaternion(new Quaternion()).invert().multiply(world))
      model.updateMatrixWorld(true)
    }
    for(const [index,{node,localAxis}]of fingers.entries()){
      const tap=Math.max(0,Math.sin(tau*time*2+index*.85))
      node.quaternion.copy(rest.get(node)).multiply(new Quaternion().setFromAxisAngle(localAxis,.10*tap))
    }
    const frame=new Map([...rest.keys()].map(node=>[node,node.quaternion.clone()]))
    frame.positions=new Map([[rig.Hips,rig.Hips.position.clone()]])
    return frame
  })
}
