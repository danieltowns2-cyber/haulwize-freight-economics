import { useCallback, useMemo, useState } from 'react';

export function stripRepeatSuffix(key:string){return key.replace(/_r[12]$/,'');}
function rotate(durations:Record<string,number>,start:number){
  const keys=Object.keys(durations);
  if(start<=0)return durations;
  return Object.fromEntries(keys.map((_,i)=>{const key=keys[(start+i)%keys.length];return [key,durations[key]];}));
}
export function useSceneControls(baseDurations:Record<string,number>){
  const sceneKeys=useMemo(()=>Object.keys(baseDurations),[baseDurations]);
  const [activeIndex,setActiveIndex]=useState(0);
  const [locked,setLocked]=useState(false);
  const [paused,setPaused]=useState(false);
  const [mountKey,setMountKey]=useState(0);
  const [tick,setTick]=useState(0);
  const durations=useMemo(()=>{
    const key=sceneKeys[activeIndex];
    return locked?{[`${key}_r1`]:baseDurations[key],[`${key}_r2`]:baseDurations[key]}:rotate(baseDurations,activeIndex);
  },[locked,activeIndex,sceneKeys,baseDurations]);
  const totalDuration=useMemo(()=>Object.values(baseDurations).reduce((a,b)=>a+b,0),[baseDurations]);
  const activeStartTime=useMemo(()=>sceneKeys.slice(0,activeIndex).reduce((a,k)=>a+baseDurations[k],0),[sceneKeys,activeIndex,baseDurations]);
  const onSceneChange=useCallback((key:string)=>{const i=sceneKeys.indexOf(stripRepeatSuffix(key));if(i>=0)setActiveIndex(i);setTick(t=>t+1);},[sceneKeys]);
  const jumpTo=useCallback((i:number)=>{setActiveIndex(i);setPaused(false);setMountKey(k=>k+1);setTick(t=>t+1);},[]);
  const toggleLock=useCallback(()=>{setLocked(l=>!l);setPaused(false);setMountKey(k=>k+1);setTick(t=>t+1);},[]);
  const togglePause=useCallback(()=>setPaused(p=>!p),[]);
  return {sceneKeys,activeIndex,locked,paused,mountKey,tick,durations,activeDuration:baseDurations[sceneKeys[activeIndex]],activeStartTime,totalDuration,onSceneChange,jumpTo,toggleLock,togglePause};
}
