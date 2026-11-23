import { Quaternion, Vector3 } from 'three'

// Two-bone leg IK: move the pelvis and knees without dragging the shoes.
export function createStandingBalance(model, rig, rest, aim) {
  model.updateMatrixWorld(true)
  const origin = rig.Hips.position.clone()
  const at = (node) => node.getWorldPosition(new Vector3())
  const legs = ['Left','Right'].map((side) => {
    const upper=rig[`${side}UpLeg`], lower=rig[`${side}Leg`], foot=rig[`${side}Foot`]
    const a=at(upper), b=at(lower), target=at(foot)
    const axis=target.clone().sub(a).normalize()
    const pole=b.clone().sub(a).addScaledVector(axis,-b.clone().sub(a).dot(axis)).normalize()
    return {upper,lower,foot,target,footRotation:foot.getWorldQuaternion(new Quaternion()),pole,upperLength:a.distanceTo(b),lowerLength:b.distanceTo(target)}
  })
  return (offset, rotation) => {
    rig.Hips.position.copy(origin).add(offset)
    rig.Hips.quaternion.copy(rotation)
    for(const {upper,lower,foot} of legs) for(const node of [upper,lower,foot]) node.quaternion.copy(rest.get(node))
    model.updateMatrixWorld(true)
    for(const leg of legs) {
      const {upper,lower,foot,target,pole,upperLength:a,lowerLength:b}=leg
      const start=at(upper)
      const axis=target.clone().sub(start)
      const distance=axis.length()
      if(distance>a+b+.001) throw new Error('Standing pose exceeds leg reach')
      axis.normalize()
      const along=(a*a-b*b+distance*distance)/(2*distance)
      const height=Math.sqrt(Math.max(0,a*a-along*along))
      const bend=pole.clone().projectOnPlane(axis).normalize()
      const knee=start.clone().addScaledVector(axis,along).addScaledVector(bend,height)
      aim(upper,lower,knee.sub(start))
      aim(lower,foot,target.clone().sub(at(lower)))
      foot.quaternion.copy(foot.parent.getWorldQuaternion(new Quaternion()).invert().multiply(leg.footRotation))
      model.updateMatrixWorld(true)
    }
  }
}
