import { motion } from 'framer-motion';
import { useState, type PropsWithChildren } from 'react';
import { useSceneTimer } from '@/lib/video';

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export function useBeat(times: number[]) {
  const [beat, setBeat] = useState(0);
  useSceneTimer(times.map((time, i) => ({ time, callback: () => setBeat(i + 1) })));
  return beat;
}
export function Reveal({children, show=true, className='', delay=0}: PropsWithChildren<{show?:boolean;className?:string;delay?:number}>) {
  return <motion.div className={className} initial={{opacity:0,y:14}} animate={{opacity:show?1:0,y:show?0:14}} transition={{duration:.38,delay,ease:EASE}}>{children}</motion.div>;
}
export function Shot({children,tone='navy',tail=false,kind='scale',name}:PropsWithChildren<{tone?:string;tail?:boolean;kind?:string;name:string}>) {
  return <motion.section className={`shot ${tone}`} data-scene={name}
    initial={{scale:kind==='depth'?1.32:1.05,rotate:kind==='split'?-2:0,opacity:1,clipPath:kind==='split'?'inset(0 48% 0 48%)':'inset(0 0% 0 0%)'}}
    animate={{scale:tail?1.055:1,rotate:tail?1.8:0,clipPath:'inset(0 0% 0 0%)'}}
    exit={{scale:1.15,opacity:0,rotate:-3,transition:{duration:.45,ease:EASE}}}
    transition={{duration:.65,ease:EASE}}>{children}</motion.section>;
}
