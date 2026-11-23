export type RobotPoint = { x: number; y: number }
export type RobotObstacle = { left: number; right: number; top: number; bottom: number }

// The overlay's head is the contact shape, rather than its transparent button box.
export function robotContact(position: RobotPoint, rectangle: RobotObstacle) {
  const radius=24,cx=position.x+38,cy=position.y+36
  let x=Math.max(rectangle.left,Math.min(rectangle.right,cx))
  let y=Math.max(rectangle.top,Math.min(rectangle.bottom,cy))
  let dx=cx-x,dy=cy-y
  const distance=Math.hypot(dx,dy)
  if(distance>=radius)return null
  if(distance<.001){
    const edges=[{distance:cx-rectangle.left,x:rectangle.left,y:cy,nx:-1,ny:0},{distance:rectangle.right-cx,x:rectangle.right,y:cy,nx:1,ny:0},{distance:cy-rectangle.top,x:cx,y:rectangle.top,nx:0,ny:-1},{distance:rectangle.bottom-cy,x:cx,y:rectangle.bottom,nx:0,ny:1}]
    const edge=edges.sort((a,b)=>a.distance-b.distance)[0]
    x=edge.x;y=edge.y;dx=edge.nx;dy=edge.ny
  }else{dx/=distance;dy/=distance}
  return {normal:{x:dx,y:dy},position:{x:x+dx*(radius+3)-38,y:y+dy*(radius+3)-36}}
}
