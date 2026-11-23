import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Popover } from '@heroui/react'
import { getAvatarReminders } from '../../domain/avatarReminders'
import type { Wellbeing } from '../../domain/wellbeing'
import RobotArt from './RobotArt'
import styles from './AvatarChat.module.css'
import { clampRobotPosition as clampPosition, useRobotMotion } from '../hooks/useRobotMotion'

type Props = { wellbeing: Wellbeing | null }
function waypoint(step: number) {
  const width=window.innerWidth, height=window.innerHeight
  if(step%4===0){
    const cards=[...document.querySelectorAll<HTMLElement>('[data-robot-obstacle]')].map(card=>card.getBoundingClientRect()).filter(rect=>rect.top>=0&&rect.bottom<height-20&&rect.width>100)
    const card=cards[Math.floor(step/4)%Math.max(1,cards.length)]
    if(card)return clampPosition({x:(card.left+card.right)/2-38,y:card.bottom-46})
  }
  const route=[{x:width-96,y:height*.35},{x:16,y:height*.56},{x:width-96,y:height*.68},{x:width*.38,y:88},{x:16,y:height*.3},{x:width-96,y:height*.55}]
  return clampPosition(route[step%route.length])
}

export default function AvatarChat({ wellbeing }: Props) {
  const reminders=useMemo(()=>wellbeing?getAvatarReminders(wellbeing):[],[wellbeing])
  const [index,setIndex]=useState(0)
  const [open,setOpen]=useState(false)
  const [acknowledged,setAcknowledged]=useState(false)
  const [typing,setTyping]=useState(false)
  const [engaged,setEngaged]=useState(false)
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [roaming,setRoaming]=useState(()=>!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [visible,setVisible]=useState(()=>document.visibilityState==='visible')
  const [hop,setHop]=useState(0)
  const [hidden,setHidden]=useState(false)
  const [overDismiss,setOverDismiss]=useState(false)
  const dismissTarget=useRef<HTMLDivElement>(null)
  function isOverDismiss(point: {x:number;y:number}) {
    const rect=dismissTarget.current?.getBoundingClientRect()
    return !!rect&&Math.hypot(point.x-(rect.left+rect.width/2),point.y-(rect.top+rect.height/2))<=48
  }
  const motion=useRobotMotion({
    onDragMove:point=>setOverDismiss(isOverDismiss(point)),
    onDrop:point=>{
      const dismiss=isOverDismiss(point)
      setOverDismiss(false)
      if(dismiss){setOpen(false);setEngaged(false);setHop(0);setHidden(true)}
      return dismiss
    },
  })
  const {position,moving,running,facing,gait,dragging,dizzy,lastDrop,freeze,travelTo,suppressPress}=motion
  const routeIndex=useRef(0)
  const reminder=reminders[index%Math.max(1,reminders.length)]

  const closeChat=useCallback(()=>{
    setOpen(false);setEngaged(false);setAcknowledged(false);setHop(0);setIndex(value=>value+1)
  },[])

  useEffect(()=>{
    const visibility=()=>setVisible(document.visibilityState==='visible')
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)')
    const motion=()=>{setReduced(preference.matches);if(preference.matches)setRoaming(false)}
    document.addEventListener('visibilitychange',visibility)
    preference.addEventListener('change',motion)
    return ()=>{document.removeEventListener('visibilitychange',visibility);preference.removeEventListener('change',motion)}
  },[])

  useEffect(()=>{
    if(hidden||!reminder||open||!roaming||!visible||reduced||dragging||moving||dizzy)return
    const timeout=setTimeout(()=>{
      if(hop%3===2){setEngaged(false);setOpen(true);setHop(value=>value+1)}
      else travelTo(waypoint(routeIndex.current++),()=>setHop(value=>value+1))
    },Math.max(1100,lastDrop+4000-Date.now()))
    return ()=>clearTimeout(timeout)
  },[hidden,reminder?.id,open,roaming,visible,reduced,hop,dragging,moving,dizzy,lastDrop,travelTo])

  useEffect(()=>{if(hidden||open||!roaming||!visible||reduced)freeze()},[hidden,open,roaming,visible,reduced,freeze])
  useEffect(()=>{
    if(!hidden)return
    const timeout=setTimeout(()=>setHidden(false),20*60*1000)
    return()=>clearTimeout(timeout)
  },[hidden])

  useEffect(()=>{
    if(!reminder||!open)return
    if(reduced){setTyping(false);return}
    setTyping(true)
    const timeout=setTimeout(()=>setTyping(false),650)
    return ()=>clearTimeout(timeout)
  },[reminder?.id,open,reduced])

  useEffect(()=>{
    if(!open||engaged||typing||!roaming||!visible)return
    const timeout=setTimeout(closeChat,12000)
    return ()=>clearTimeout(timeout)
  },[open,engaged,typing,roaming,visible,closeChat])

  function changeOpen(next: boolean){
    if(next&&suppressPress())return
    if(!next){closeChat();return}
    freeze()
    setEngaged(true);setOpen(true)
  }

  if(hidden||!reminder)return null
  return <><div className={styles.dropZone} data-visible={dragging} data-active={dragging&&overDismiss} aria-hidden="true">
    <div ref={dismissTarget} className={styles.dropTarget}><span>{'\u00d7'}</span></div>
  </div><Popover isOpen={open} onOpenChange={changeOpen}>
    <div className={styles.mover} data-open={open} data-moving={moving} data-running={running} data-dragging={dragging} data-dizzy={dizzy} {...motion.pointerHandlers} onClickCapture={(event)=>{if(suppressPress()){event.preventDefault();event.stopPropagation()}}} style={{transform:`translate3d(${position.x}px,${position.y}px,0)`, '--robot-facing': facing, '--leg-swing': `${gait.leg}deg`, '--knee-left': `${gait.kneeLeft}deg`, '--knee-right': `${-gait.kneeRight}deg`, '--body-bob': `${gait.bob}px`, '--body-lean': `${gait.lean}deg`} as import('react').CSSProperties}>
    <Button variant="ghost" className={styles.launcher} data-open={open} data-roaming={roaming&&visible} aria-label="Robot companion. Drag to move, or click for reminders.">
      <span className={styles.robotFacing}><span className={styles.robotFloat}><RobotArt/></span></span>
      {dizzy&&<span className={styles.dizzyStars} aria-hidden="true"><i>{'\u2726'}</i><i>{'\u2726'}</i><i>{'\u2726'}</i></span>}
      <span className={styles.launcherLabel}>{dragging?'Drop me':dizzy?'Oops!':open?'Hello!':moving?(running?'On my way!':'Walking...'):'Drag me'}</span>
    </Button>
    </div>
    <Popover.Content className={styles.panel} placement="top start" offset={10} isNonModal>
      <Popover.Dialog className={styles.dialog}>
        <div onPointerDownCapture={()=>setEngaged(true)} onKeyDownCapture={()=>setEngaged(true)}>
        <header className={styles.header}>
          <div><Popover.Heading className={styles.heading}>Your little companion</Popover.Heading><p className={styles.subtitle}>A small reminder, just for you.</p></div>
          <Button variant="ghost" isIconOnly className={styles.dismiss} aria-label="Close reminder and let the robot continue" onPress={closeChat}><span aria-hidden="true">×</span></Button>
        </header>
        <div className={styles.conversation}>
          {typing?<span className={styles.typing} aria-label="Your robot is typing"><i/><i/><i/></span>:<>
            <p className={styles.message}>{reminder.text}</p>
            {acknowledged&&<><p className={styles.userReply}>{reminder.action}</p><p className={styles.message}>{reminder.acknowledgement}</p></>}
          </>}
        </div>
        <div className={styles.actions}>
          {!acknowledged&&<Button variant="outline" className={styles.reply} isDisabled={typing} onPress={()=>{setEngaged(true);setAcknowledged(true)}}>{reminder.action}</Button>}
          <Button variant="ghost" className={styles.next} isDisabled={typing} onPress={()=>{setEngaged(true);setAcknowledged(false);setIndex(value=>value+1)}}>Another tip</Button>
        </div>
        <div className={styles.footer}><span>{roaming?'I pause when we chat.':'Staying right here.'}</span><Button variant="ghost" className={styles.roamControl} isDisabled={reduced} onPress={()=>{setEngaged(true);setRoaming(value=>!value)}}>{reduced?'Reduced motion':roaming?'Pause roaming':'Resume roaming'}</Button></div>
        </div>
      </Popover.Dialog>
    </Popover.Content>
  </Popover></>
}
