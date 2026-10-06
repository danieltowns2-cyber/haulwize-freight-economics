import { motion } from 'framer-motion';
import { Shot, Reveal, useBeat, EASE } from '../Shot';

export function AudienceScene() {
  const beat=useBeat([300,1000,1700,2350,3150]);
  return <Shot name="audience" tail={beat>=5} kind="depth">
    <motion.img className="photo" src={`${import.meta.env.BASE_URL}images/truck-dawn.jpg`} alt="" initial={{scale:1.12}} animate={{scale:1.04}} transition={{duration:4,ease:'linear'}}/>
    <div className="photo-shade" style={{background:'#17263dde'}}/>
    <h1 className="chapter">Better rate<br/>conversations.</h1>
    <div className="audience-stage">
      <motion.div className="audience-line" initial={{scaleY:0}} animate={{scaleY:beat>=3?1:beat>=2?.66:beat>=1?.33:0}} transition={{duration:.55,ease:EASE}}/>
      {['Drivers & owners','Dispatchers','Freight brokers'].map((text,i)=><Reveal key={text} show={beat>=i+1}><div className="audience-item">{text}</div></Reveal>)}
    </div>
    <Reveal className="audience-caption" show={beat>=4}>Carrier costs.<br/>Customer negotiations.</Reveal>
  </Shot>;
}
