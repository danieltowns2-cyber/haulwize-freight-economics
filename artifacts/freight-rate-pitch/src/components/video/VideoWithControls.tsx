import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronDown, ChevronUp, Pause, Play, Repeat, Volume2, VolumeX } from 'lucide-react';
import VideoTemplate,{ SCENE_DURATIONS } from './VideoTemplate';
import { useSceneControls } from './useSceneControls';
import { SCENE_DETAILS } from './sceneMeta';

function formatTime(ms:number){const sec=Math.max(0,Math.floor(ms/1000));return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;}
function PlaybackStatus({sceneKeys,activeIndex,activeDuration,activeStartTime,totalDuration,tick,paused,onJumpTo}:{
  sceneKeys:string[];activeIndex:number;activeDuration:number;activeStartTime:number;totalDuration:number;tick:number;paused:boolean;onJumpTo:(i:number)=>void;
}){
  const [elapsed,setElapsed]=useState(0);
  const base=useRef(0);
  useEffect(()=>{setElapsed(0);base.current=0;},[tick]);
  useEffect(()=>{
    if(paused)return;
    const start=performance.now();
    const id=window.setInterval(()=>setElapsed(base.current+performance.now()-start),60);
    return ()=>{window.clearInterval(id);base.current+=performance.now()-start;};
  },[tick,paused]);
  const progress=activeDuration>0?Math.min(1,elapsed/activeDuration):0;
  const totalElapsed=Math.min(totalDuration,activeStartTime+Math.min(elapsed,activeDuration));
  return <><div className="control-segments">{sceneKeys.map((key,i)=><button key={key} onClick={()=>onJumpTo(i)} aria-label={`Jump to scene ${i+1}`} aria-current={i===activeIndex?'true':undefined}><i style={{width:`${i===activeIndex?progress*100:0}%`}}/></button>)}</div><span className="control-count">{activeIndex+1}/{sceneKeys.length}</span><span className="control-time" role="timer">{formatTime(totalElapsed)} / {formatTime(totalDuration)}</span></>;
}
export default function VideoWithControls(){
  const isIframed=typeof window!=='undefined'&&window.self!==window.top;
  const controls=useSceneControls(SCENE_DURATIONS);
  const [muted,setMuted]=useState(false);
  const [collapsed,setCollapsed]=useState(false);
  const [hovering,setHovering]=useState(false);
  const [tapPinned,setTapPinned]=useState(false);
  const sensorRef=useRef<HTMLDivElement>(null);
  const handleJump=useCallback((index:number)=>{
    controls.jumpTo(index);
    const details=SCENE_DETAILS[controls.sceneKeys[index]];
    if(details?.filePath)window.parent.postMessage({type:'REPLIT_VIDEO_SCENE_SELECTED',payload:{sceneIndex:index,sceneCount:controls.sceneKeys.length,sceneTitle:details.title,filePath:details.filePath,lineNumber:1}},'*');
  },[controls.jumpTo,controls.sceneKeys]);
  useEffect(()=>{
    if(!controls.paused)return;
    const frozen=document.getAnimations().filter(a=>a.playState==='running');
    frozen.forEach(a=>a.pause());
    return ()=>frozen.forEach(a=>a.play());
  },[controls.paused]);
  useEffect(()=>{
    if(!(collapsed&&tapPinned))return;
    const handler=(e:PointerEvent)=>{if(e.pointerType!=='mouse'&&sensorRef.current&&!sensorRef.current.contains(e.target as Node))setTapPinned(false);};
    document.addEventListener('pointerdown',handler);
    return ()=>document.removeEventListener('pointerdown',handler);
  },[collapsed,tapPinned]);
  const toggleCollapsed=()=>setCollapsed(c=>{if(!c){setHovering(false);setTapPinned(false);}return !c;});
  const onEnter=(e:ReactPointerEvent<HTMLDivElement>)=>{if(e.pointerType==='mouse')setHovering(true);};
  const onLeave=(e:ReactPointerEvent<HTMLDivElement>)=>{if(e.pointerType==='mouse')setHovering(false);};
  const visible=!collapsed||hovering||tapPinned;
  if(!isIframed)return <VideoTemplate/>;
  return <div style={{position:'relative',width:'100%',height:'100vh'}}>
    <VideoTemplate key={controls.mountKey} durations={controls.durations} loop paused={controls.paused} muted={muted} onSceneChange={controls.onSceneChange}/>
    <div className="controls-sensor" ref={sensorRef} onPointerEnter={onEnter} onPointerLeave={onLeave} onPointerDown={e=>{if(e.pointerType!=='mouse'&&collapsed)setTapPinned(true);}}>
      <div style={{flex:1,width:'100%'}} aria-hidden="true"/>
      <div className="film-controls" style={{transform:visible?'translateY(0)':'translateY(100%)',opacity:visible?1:0,pointerEvents:visible?'auto':'none'}} aria-hidden={!visible}>
        <button aria-label={controls.paused?'Play':'Pause'} title={controls.paused?'Play':'Pause'} onClick={controls.togglePause}>{controls.paused?<Play/>:<Pause/>}</button>
        <button aria-label="Loop current scene" title="Loop current scene" aria-pressed={controls.locked} onClick={controls.toggleLock}><Repeat/></button>
        <button aria-label={muted?'Unmute music':'Mute music'} title={muted?'Unmute music':'Mute music'} aria-pressed={muted} onClick={()=>setMuted(m=>!m)}>{muted?<VolumeX/>:<Volume2/>}</button>
        <span style={{height:22,width:1,background:'#ffffff30'}} aria-hidden="true"/>
        <PlaybackStatus {...controls} onJumpTo={handleJump}/>
        <button aria-label={collapsed?'Show controls':'Hide controls'} aria-expanded={!collapsed} onClick={toggleCollapsed}>{collapsed?<ChevronUp/>:<ChevronDown/>}</button>
      </div>
    </div>
  </div>;
}
