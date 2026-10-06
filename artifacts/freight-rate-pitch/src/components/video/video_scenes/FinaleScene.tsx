import { motion } from 'framer-motion';
import { Shot, Reveal, useBeat, EASE } from '../Shot';

export function FinaleScene() {
  const beat=useBeat([250,900,1650,2450,3100,3600,4150]);
  return <Shot name="finale" tone="ivory" tail={beat>=7}>
    <div className="final-lockup">
      <motion.img className="final-logo" src={`${import.meta.env.BASE_URL}images/logo.svg`} alt="Freight Rate Calculator" initial={{scale:.75,rotate:-8}} animate={{scale:1,rotate:0}} transition={{duration:.65,ease:EASE}}/>
      <Reveal show={beat>=1} className="final-name">FREIGHT RATE<br/>CALCULATOR</Reveal>
      <div className="final-title"><Reveal show={beat>=2}>Know your costs.</Reveal><Reveal show={beat>=3}>Quote with<br/>confidence.</Reveal></div>
      <Reveal show={beat>=4} className="final-audience">For carriers · dispatchers · brokers</Reveal>
      <Reveal show={beat>=5} className="final-line">Put real costs behind your next rate.</Reveal>
      <motion.div className="final-underline" initial={{scaleX:0}} animate={{scaleX:beat>=6?1:0}} transition={{duration:.5,ease:EASE}}/>
    </div>
  </Shot>;
}
