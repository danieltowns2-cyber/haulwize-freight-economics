import { VideoCanvas, VideoPausedContext, useVideoPlayer, type VideoAspectRatio } from '@/lib/video';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HookScene } from './video_scenes/HookScene';
import { CostsScene } from './video_scenes/CostsScene';
import { QuoteScene } from './video_scenes/QuoteScene';
import { ActualsScene } from './video_scenes/ActualsScene';
import { AudienceScene } from './video_scenes/AudienceScene';
import { FinaleScene } from './video_scenes/FinaleScene';

export const SCENE_DURATIONS = { hook:4000, costs:5000, quote:6000, actuals:6000, audience:4000, finale:5000 };
const VIDEO_ASPECT_RATIO:VideoAspectRatio='9:16';
const SCENES={hook:HookScene,costs:CostsScene,quote:QuoteScene,actuals:ActualsScene,audience:AudienceScene,finale:FinaleScene};
const SCENE_START_SEC:Record<string,number>=(()=>{
  let ms=0;
  return Object.fromEntries(Object.entries(SCENE_DURATIONS).map(([key,duration])=>{const start=ms/1000;ms+=duration;return [key,start];}));
})();

export default function VideoTemplate({durations=SCENE_DURATIONS,loop=true,paused=false,muted=false,onSceneChange}:{
  durations?:Record<string,number>;loop?:boolean;paused?:boolean;muted?:boolean;onSceneChange?:(key:string)=>void;
}={}) {
  const {currentSceneKey}=useVideoPlayer({durations,loop,paused});
  const baseSceneKey=currentSceneKey.replace(/_r[12]$/,'') as keyof typeof SCENES;
  const sceneIndex=Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const Scene=SCENES[baseSceneKey];
  const audioRef=useRef<HTMLAudioElement>(null);
  const lastSceneKeyRef=useRef<string|null>(null);
  useEffect(()=>{onSceneChange?.(currentSceneKey);},[currentSceneKey,onSceneChange]);
  useEffect(()=>{
    const audio=audioRef.current;
    if(!audio)return;
    audio.volume=.45;
    if(paused){audio.pause();return;}
    if(lastSceneKeyRef.current!==currentSceneKey){
      lastSceneKeyRef.current=currentSceneKey;
      const target=SCENE_START_SEC[baseSceneKey]??0;
      if(Math.abs(audio.currentTime-target)>.18)audio.currentTime=target;
    }
    audio.play().catch(()=>{});
  },[currentSceneKey,baseSceneKey,muted,paused]);
  return <VideoPausedContext.Provider value={paused}><VideoCanvas className="film" aspectRatio={VIDEO_ASPECT_RATIO} style={{backgroundColor:'#263449'}}>
    <motion.div style={{position:'absolute',inset:0}} animate={{scale:1+sceneIndex*.002}} transition={{duration:1}}>
      <AnimatePresence mode="sync">{Scene&&<Scene key={currentSceneKey}/>}</AnimatePresence>
    </motion.div>
    <motion.div className="brand-strip" initial={false} animate={{opacity:sceneIndex===5?0:1,color:sceneIndex===1||sceneIndex===3?'#263449':'#fbf8f0'}}>
      <img src={`${import.meta.env.BASE_URL}images/logo.svg`} alt=""/><span>FREIGHT RATE CALCULATOR</span>
    </motion.div>
    <motion.div className="road-thread" initial={false}
      animate={{left:sceneIndex===0?'50%':sceneIndex===5?'50%':'95%',top:sceneIndex===0?'66%':sceneIndex===5?'88%':'20%',width:sceneIndex===0?'1.5%':'.8%',height:sceneIndex===5?'12%':sceneIndex===0?'34%':'62%',rotate:sceneIndex===2?3:0}}
      transition={{duration:.75,ease:[.22,1,.36,1]}}/>
    <audio ref={audioRef} src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`} preload="auto" autoPlay muted={muted}/>
  </VideoCanvas></VideoPausedContext.Provider>;
}
