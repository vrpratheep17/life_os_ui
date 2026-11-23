import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { robotContact } from '../../domain/robotCollision'

type Point = { x: number; y: number }
export const clampRobotPosition = (point: Point): Point => ({
  x: Math.max(12,Math.min(window.innerWidth-88,point.x)),
  y: Math.max(12,Math.min(window.innerHeight-118,point.y)),
})

export function useRobotMotion(options?: { onDrop: (point: Point) => boolean; onDragMove: (point: Point) => void }) {
  const [position,setPosition]=useState(()=>clampRobotPosition({x:window.innerWidth-96,y:window.innerHeight-145}))
  const current=useRef(position)
  const frame=useRef(0)
  const [moving,setMoving]=useState(false)
  const [running,setRunning]=useState(false)
  const [facing,setFacing]=useState(1)
  const [gait,setGait]=useState({leg:0,kneeLeft:0,kneeRight:0,bob:0,lean:0})
  const [dragging,setDragging]=useState(false)
  const [lastDrop,setLastDrop]=useState(0)
  const [dizzy,setDizzy]=useState(false)
  const recovery=useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastHit=useRef(-Infinity)
  const hitElement=useRef<HTMLElement | null>(null)
  const clearHit=useCallback(()=>{
    if(recovery.current)clearTimeout(recovery.current)
    recovery.current=null
    hitElement.current?.removeAttribute('data-robot-hit')
    hitElement.current=null
    setDizzy(false)
  },[])
  const suppressUntil=useRef(0)
  const drag=useRef<{id:number;startX:number;startY:number;origin:Point;moved:boolean}|null>(null)
  const place=useCallback((point:Point)=>{
    const next=clampRobotPosition(point)
    current.current=next;setPosition(next)
  },[])
  const freeze=useCallback(()=>{cancelAnimationFrame(frame.current);setMoving(false);setRunning(false);clearHit()},[clearHit])
  const collide=useCallback((point:Point,onRecovered:()=>void)=>{
    if(performance.now()-lastHit.current<7500||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return false
    for(const element of document.querySelectorAll<HTMLElement>('[data-robot-obstacle]')){
      const rect=element.getBoundingClientRect()
      if(!rect.width||!rect.height||rect.bottom<0||rect.top>window.innerHeight)continue
      const contact=robotContact(point,rect)
      if(!contact)continue
      lastHit.current=performance.now()
      setMoving(false);setRunning(false);setDizzy(true)
      element.setAttribute('data-robot-hit','true');hitElement.current=element
      const start={...point},target=clampRobotPosition({x:contact.position.x+contact.normal.x*14,y:contact.position.y+contact.normal.y*14})
      const began=performance.now()
      const bounce=(now:number)=>{
        const t=Math.min(1,(now-began)/280),ease=1-Math.pow(1-t,3)
        place({x:start.x+(target.x-start.x)*ease,y:start.y+(target.y-start.y)*ease})
        if(t<1)frame.current=requestAnimationFrame(bounce)
      }
      frame.current=requestAnimationFrame(bounce)
      recovery.current=setTimeout(()=>{
        clearHit();setFacing(contact.normal.x>=0?1:-1);onRecovered()
      },2100)
      return true
    }
    return false
  },[clearHit,place])
  const travelTo=useCallback((point:Point,onArrival:()=>void)=>{
    cancelAnimationFrame(frame.current)
    const start={...current.current},target=clampRobotPosition(point)
    const dx=target.x-start.x,dy=target.y-start.y,distance=Math.hypot(dx,dy)
    if(distance<10){place(target);onArrival();return}
    const fast=distance>320
    const duration=Math.max(1400,distance/(fast?110:65)*1000)
    const strides=Math.max(1,Math.round(distance/34))
    const started=performance.now()
    const initiallyInside=new Set([...document.querySelectorAll<HTMLElement>('[data-robot-obstacle]')].filter(element=>robotContact(start,element.getBoundingClientRect())))
    setFacing(dx>=0?1:-1);setMoving(true)
    const tick=(now:number)=>{
      const t=Math.min(1,(now-started)/duration)
      const eased=(1-Math.cos(Math.PI*t))/2
      const arc=Math.sin(Math.PI*t)*Math.min(22,distance*.045)
      const phase=eased*strides*Math.PI*2
      const step=Math.sin(phase)
      setGait({leg:step*(fast?28:23),kneeLeft:Math.max(0,step)*34,kneeRight:Math.max(0,-step)*34,bob:-step*step*(fast?4:2),lean:Math.sin(Math.PI*t)*(fast?6:2)})
      const next=clampRobotPosition({x:start.x+dx*eased-dy/distance*arc,y:start.y+dy*eased+dx/distance*arc})
      const inInitial=[...initiallyInside].some(element=>robotContact(next,element.getBoundingClientRect()))
      if(!inInitial&&collide(next,onArrival))return
      place(next)
      setRunning(fast&&t>.15&&t<.85)
      if(t<1)frame.current=requestAnimationFrame(tick)
      else{setMoving(false);setRunning(false);onArrival()}
    }
    frame.current=requestAnimationFrame(tick)
  },[place,collide])

  useEffect(()=>{
    const resize=()=>{freeze();place(current.current)}
    window.addEventListener('resize',resize)
    return()=>{window.removeEventListener('resize',resize);cancelAnimationFrame(frame.current);if(recovery.current)clearTimeout(recovery.current);hitElement.current?.removeAttribute('data-robot-hit')}
  },[freeze,place])

  function pointerDown(event:ReactPointerEvent<HTMLDivElement>){
    if(event.button!==0||!event.isPrimary)return
    freeze()
    drag.current={id:event.pointerId,startX:event.clientX,startY:event.clientY,origin:{...current.current},moved:false}
  }
  function pointerMove(event:ReactPointerEvent<HTMLDivElement>){
    const active=drag.current
    if(!active||active.id!==event.pointerId)return
    const dx=event.clientX-active.startX,dy=event.clientY-active.startY
    if(!active.moved&&Math.hypot(dx,dy)<6)return
    active.moved=true
    setDragging(true)
    options?.onDragMove({x:event.clientX,y:event.clientY})
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault();event.stopPropagation()
    if(Math.abs(dx)>3)setFacing(dx>0?1:-1)
    place({x:active.origin.x+dx,y:active.origin.y+dy})
  }
  function pointerUp(event:ReactPointerEvent<HTMLDivElement>){
    const active=drag.current
    if(!active||active.id!==event.pointerId)return
    if(active.moved){
      suppressUntil.current=performance.now()+600;setLastDrop(Date.now())
      const dismissed=event.type!=='pointercancel'&&options?.onDrop({x:event.clientX,y:event.clientY})
      if(!dismissed)collide(current.current,()=>setLastDrop(Date.now()))
      event.preventDefault();event.stopPropagation()
    }
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)
    drag.current=null;setDragging(false)
  }
  const suppressPress=useCallback(()=>!!drag.current?.moved||performance.now()<suppressUntil.current,[])
  return {position,moving,running,facing,gait,dragging,dizzy,lastDrop,freeze,travelTo,suppressPress,
    pointerHandlers:{onPointerDownCapture:pointerDown,onPointerMoveCapture:pointerMove,onPointerUpCapture:pointerUp,onPointerCancelCapture:pointerUp}}
}
