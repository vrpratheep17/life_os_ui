import { AnimationClip, Quaternion, QuaternionKeyframeTrack, Vector3, VectorKeyframeTrack } from 'three'
import { createStandingBalance } from './standing-balance.mjs'
import { authorWorkClip } from './work.mjs'

// Animation authoring in character space. The FBX's identity helper joints are
// deliberately excluded: animating both a joint and its helper doubles rotation.
export function authorAvatarMotions(model, joints) {
  const find = (suffix) => [...joints.values()].find((node) => node.name.endsWith(suffix))
  const names = ['LeftArm','RightArm','RightForeArm','RightHand','LeftForeArm','LeftHand','Spine2','Neck','Head','LeftShoulder','RightShoulder','Hips','LeftUpLeg','RightUpLeg','LeftLeg','RightLeg','LeftFoot','RightFoot']
  const rig = Object.fromEntries(names.map((name) => [name, find(name)]))
  if (!Object.values(rig).every(Boolean)) throw new Error('The character is missing expected humanoid joints')
  model.updateMatrixWorld(true)
  const bind = new Map([...joints.values()].map((node) => [node, node.quaternion.clone()]))
  const worldZ = new Vector3(0,0,1)
  const worldRotation = (node, angle) => {
    const axis = worldZ.clone().applyQuaternion(node.parent.getWorldQuaternion(new Quaternion()).invert())
    return new Quaternion().setFromAxisAngle(axis, angle).multiply(bind.get(node))
  }
  rig.LeftArm.quaternion.copy(worldRotation(rig.LeftArm, -1.32))
  rig.RightArm.quaternion.copy(worldRotation(rig.RightArm, 1.32))
  model.updateMatrixWorld(true)
  const fingers = []
  for (const side of ['Left', 'Right']) {
    const index = find(`${side}HandIndex1`)
    const pinky = find(`${side}HandPinky1`)
    if (!index || !pinky) continue
    const axis = pinky.getWorldPosition(new Vector3()).sub(index.getWorldPosition(new Vector3())).normalize()
    for (const name of ['Index','Middle','Ring','Pinky']) {
      for (const segment of [1,2,3]) {
        const node = find(`${side}Hand${name}${segment}`)
        if (!node) continue
        const localAxis = axis.clone().applyQuaternion(node.getWorldQuaternion(new Quaternion()).invert())
        const softness = { Index: .7, Middle: .9, Ring: 1.05, Pinky: 1.15 }[name]
        const curl = (segment === 2 ? .12 : .07)*softness
        node.quaternion.multiply(new Quaternion().setFromAxisAngle(localAxis, curl))
        fingers.push({ node, localAxis, curl, side })
      }
    }
  }
  model.updateMatrixWorld(true)
  const rest = new Map([...joints.values()].map((node) => [node, node.quaternion.clone()]))
  const restPositions = new Map([...joints.values()].map((node) => [node, node.position.clone()]))
  const axes = new Map([...joints.values()].map((node) => {
    const inverse = node.getWorldQuaternion(new Quaternion()).invert()
    return [node, [new Vector3(1,0,0),new Vector3(0,1,0),new Vector3(0,0,1)].map((axis) => axis.applyQuaternion(inverse))]
  }))
  const rotate = (node, x=0, y=0, z=0) => {
    const q = rest.get(node).clone()
    for (const [index, angle] of [x,y,z].entries()) if (angle) q.multiply(new Quaternion().setFromAxisAngle(axes.get(node)[index], angle))
    return q
  }
  // Solve the actual limb directions instead of spinning imported local axes.
  // A human greeting keeps the elbow below the shoulder with the forearm upright.
  const position = (node) => node.getWorldPosition(new Vector3())
  const aim = (node, child, direction) => {
    model.updateMatrixWorld(true)
    const current = position(child).sub(position(node)).normalize()
    const world = node.getWorldQuaternion(new Quaternion())
    const target = new Quaternion().setFromUnitVectors(current,direction.clone().normalize()).multiply(world)
    node.quaternion.copy(node.parent.getWorldQuaternion(new Quaternion()).invert().multiply(target))
    model.updateMatrixWorld(true)
  }
  const middle = find('RightHandMiddle1')
  const index = find('RightHandIndex1')
  const pinky = find('RightHandPinky1')
  if (!middle || !index || !pinky) throw new Error('Hand landmarks are required to orient the waving palm')
  aim(rig.RightArm,rig.RightForeArm,new Vector3(-.8,-.42,.18))
  aim(rig.RightForeArm,rig.RightHand,new Vector3(-.08,.97,.2))
  const up = new Vector3(0,1,.04).normalize()
  aim(rig.RightHand,middle,up)
  const normal = position(index).sub(position(rig.RightHand)).cross(position(pinky).sub(position(rig.RightHand))).normalize()
  const targetNormal = new Vector3(0,0,1).projectOnPlane(up).normalize()
  const twist = Math.atan2(up.dot(normal.clone().cross(targetNormal)),normal.dot(targetNormal))
  const palmWorld = new Quaternion().setFromAxisAngle(up,twist).multiply(rig.RightHand.getWorldQuaternion(new Quaternion()))
  rig.RightHand.quaternion.copy(rig.RightHand.parent.getWorldQuaternion(new Quaternion()).invert().multiply(palmWorld))
  model.updateMatrixWorld(true)
  const raisedArm = rig.RightArm.quaternion.clone()
  const raisedForearm = rig.RightForeArm.quaternion.clone()
  const raisedHand = rig.RightHand.quaternion.clone()
  const forearmAxis = worldZ.clone().applyQuaternion(rig.RightForeArm.getWorldQuaternion(new Quaternion()).invert())
  const handAxis = worldZ.clone().applyQuaternion(rig.RightHand.getWorldQuaternion(new Quaternion()).invert())
  for (const node of [rig.RightArm,rig.RightForeArm,rig.RightHand]) node.quaternion.copy(rest.get(node))
  model.updateMatrixWorld(true)

  const clamp = (value) => Math.max(0, Math.min(1, value))
  const ease = (value) => { const t=clamp(value); return t*t*t*(t*(t*6-15)+10) }
  const pulse = (time, start, rise, fall, end) => ease((time-start)/(rise-start)) * (1-ease((time-fall)/(end-fall)))
  const tau = Math.PI*2
  const balance = createStandingBalance(model,rig,rest,aim)
  const sampleClip = (name, duration, nodes, pose) => {
    const frameCount = Math.round(duration*60)
    const times = Array.from({length:frameCount+1}, (_,index) => index*duration/frameCount)
    const values = new Map(nodes.map((node) => [node, []]))
    const positions = new Map()
    for (const time of times) {
      const frame = pose(time)
      for (const node of nodes) values.get(node).push(...(frame.get(node) ?? rest.get(node)).toArray())
      for (const [node, value] of frame.positions ?? []) {
        if(!positions.has(node))positions.set(node,[])
        positions.get(node).push(...value.toArray())
      }
    }
    const tracks=nodes.map((node) => new QuaternionKeyframeTrack(`${node.uuid}.quaternion`, times, values.get(node)))
    for(const [node, values] of positions) tracks.push(new VectorKeyframeTrack(`${node.uuid}.position`,times,values))
    for(const [node, value] of rest) { node.quaternion.copy(value); node.position.copy(restPositions.get(node)) }
    model.updateMatrixWorld(true)
    return new AnimationClip(name,duration,tracks).optimize()
  }
  const upperBody = [rig.Spine2,rig.Neck,rig.Head,rig.LeftShoulder,rig.RightShoulder]
  const lowerBody = [rig.Hips,rig.LeftUpLeg,rig.RightUpLeg,rig.LeftLeg,rig.RightLeg,rig.LeftFoot,rig.RightFoot]
  const idle = sampleClip('Idle', 8, [...upperBody,...lowerBody,rig.LeftArm,rig.RightArm,rig.LeftForeArm,rig.RightForeArm,...fingers.map(({node})=>node)], (time) => {
    // Layer breathing, a slow posture shift, and occasional attention changes.
    // The pelvis shifts over the supporting leg while IK keeps both shoes planted.
    const breath = Math.sin(tau*time/4)
    const drift = Math.sin(tau*time/8)**3
    const settle = Math.sin(tau*time/8)
    const glance = .10*pulse(time,.5,1.6,2.1,3.4)-.075*pulse(time,4.1,5.2,5.8,7.1)
    balance(new Vector3(1.8*drift,-1.1*settle*settle,.25*drift),rotate(rig.Hips,0,.01*drift,.006*drift))
    const frame = new Map([
      [rig.Spine2,rotate(rig.Spine2,.014*breath,.012*drift,.022*drift)],
      [rig.Neck,rotate(rig.Neck,-.006*breath,glance*.25,-.008*drift)],
      [rig.Head,rotate(rig.Head,.012*breath,glance,-.018*drift)],
      [rig.LeftShoulder,rotate(rig.LeftShoulder,.004*settle,0,.008*breath)],
      [rig.RightShoulder,rotate(rig.RightShoulder,-.004*settle,0,-.008*breath)],
      [rig.LeftArm,rotate(rig.LeftArm,.032*settle,0,-.012*drift)],
      [rig.RightArm,rotate(rig.RightArm,-.027*settle,0,.012*drift)],
      [rig.LeftForeArm,rotate(rig.LeftForeArm,.018*settle,0,0)],
      [rig.RightForeArm,rotate(rig.RightForeArm,-.016*settle,0,0)],
    ])
    for(const node of lowerBody)frame.set(node,node.quaternion.clone())
    for(const {node,localAxis} of fingers)frame.set(node,rest.get(node).clone().multiply(new Quaternion().setFromAxisAngle(localAxis,.018*breath)))
    frame.positions=new Map([[rig.Hips,rig.Hips.position.clone()]])
    return frame
  })
  const waveNodes = [...upperBody,rig.RightArm,rig.RightForeArm,rig.RightHand,...fingers.filter(({side})=>side==='Right').map(({node})=>node)]
  const wave = sampleClip('Wave', 4.3, waveNodes, (time) => {
    const lift = pulse(time,.12,1.08,2.95,4.18)
    const bend = pulse(time,0,.92,3.06,4.3)
    const palm = pulse(time,.18,1.1,2.95,4.25)
    const hello = pulse(time,.98,1.36,2.65,3.02)
    const swing = Math.sin(tau*1.45*(time-1.2))*hello
    const posture = pulse(time,0,.9,3.05,4.3)
    const frame = new Map([
      [rig.RightArm,rest.get(rig.RightArm).clone().slerp(raisedArm,lift)],
      [rig.RightForeArm,rest.get(rig.RightForeArm).clone().slerp(raisedForearm,bend).multiply(new Quaternion().setFromAxisAngle(forearmAxis,.045*swing))],
      [rig.RightHand,rest.get(rig.RightHand).clone().slerp(raisedHand,palm).multiply(new Quaternion().setFromAxisAngle(handAxis,.21*swing))],
      [rig.Spine2,rotate(rig.Spine2,0,-.025*posture,-.018*posture)],
      [rig.Neck,rotate(rig.Neck,0,.02*posture,0)],
      [rig.Head,rotate(rig.Head,.025*posture,.045*posture,.035*posture)],
      [rig.LeftShoulder,rotate(rig.LeftShoulder,0,0,-.012*posture)],
      [rig.RightShoulder,rotate(rig.RightShoulder,0,0,-.035*lift)],
    ])
    // Open the relaxed hand during the greeting, then return each finger to rest.
    for (const {node,localAxis,curl,side} of fingers) if (side==='Right') frame.set(node,rest.get(node).clone().multiply(new Quaternion().setFromAxisAngle(localAxis,-curl*lift)))
    return frame
  })
  const nod = sampleClip('Nod', 2.6, upperBody, (time) => {
    const dip = .16*pulse(time,.2,.65,.72,1.16) + .10*pulse(time,1.16,1.5,1.6,2.04)
    const engage = pulse(time,0,.5,1.9,2.6)
    return new Map([
      [rig.Head,rotate(rig.Head,dip,0,.012*engage)],
      [rig.Neck,rotate(rig.Neck,dip*.3)],
      [rig.Spine2,rotate(rig.Spine2,.015*engage)],
    ])
  })
  const lookAround = sampleClip('LookAround', 5, upperBody, (time) => {
    const gaze = -.34*pulse(time,.15,1.1,1.55,2.3) + .29*pulse(time,2.35,3.15,3.65,4.75)
    return new Map([
      [rig.Head,rotate(rig.Head,-.025*Math.abs(gaze),gaze*.73,0)],
      [rig.Neck,rotate(rig.Neck,0,gaze*.2)],
      [rig.Spine2,rotate(rig.Spine2,0,gaze*.1)],
    ])
  })
  const work = authorWorkClip({ model,rig,rest,restPositions,aim,rotate,fingers,sampleClip })
  return { clips: [idle,wave,nod,lookAround,work], rig }
}
