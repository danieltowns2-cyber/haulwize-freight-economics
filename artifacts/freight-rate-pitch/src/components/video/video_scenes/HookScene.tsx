import { motion } from 'framer-motion';
import { Shot, useBeat, EASE } from '../Shot';

export function HookScene() {
  const beat=useBeat([450,900,1350,1800,2100,2600,3100]);
  return <Shot name="hook" tail={beat>=7}>
    <motion.img className="photo" src={`${import.meta.env.BASE_URL}images/truck-dawn.jpg`} alt="" initial={{scale:1.08}} animate={{scale:1.2}} transition={{duration:4,ease:'linear'}}/>
    <div className="photo-shade"/>
    <div className="hook">
      {['A good rate','starts with','REAL','COSTS.'].map((text,i)=><div key={text} className={i>1?'big':''}><motion.div initial={{y:i? '105%':0}} animate={{y:beat>=i?'0%':'105%'}} transition={{type:'spring',stiffness:320,damping:28}}>{text}</motion.div></div>)}
      <motion.div style={{height:'1vmin',background:'#df872e',width:'75%',marginTop:'2vmin'}} initial={{scaleX:0}} animate={{scaleX:beat>=4?1:0}} transition={{duration:.4,ease:EASE}}/>
    </div>
    <motion.div className="hook-note" initial={{opacity:0}} animate={{opacity:beat>=5?1:0}} transition={{duration:.25}}>Not guesswork.</motion.div>
  </Shot>;
}
