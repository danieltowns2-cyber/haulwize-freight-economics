import { motion } from 'framer-motion';
import { Shot, Reveal, useBeat, EASE } from '../Shot';

export function QuoteScene() {
  const beat=useBeat([350,1000,1700,2450,3250,4000,4800,5100]);
  return <Shot name="quote" tail={beat>=8} kind="depth">
    <h1 className="chapter">Price the<br/>whole load.</h1>
    <motion.div className="quote-ticket" initial={{rotateY:8,scale:1.12}} animate={{rotateY:beat>=7?-4:0,scale:beat>=7?.97:1}} transition={{duration:.65,ease:EASE}}>
      <Reveal show={beat>=1} className="mileage">1,000 loaded + 100 deadhead miles</Reveal>
      <Reveal show={beat>=2} className="target"><div className="eyebrow">Target rate</div><div className="rate mono">$2,857</div></Reveal>
      <Reveal show={beat>=3} className="fine">20% target margin · 3% fees</Reveal>
      <Reveal show={beat>=4}><div className="offer"><span className="fine">Broker offer</span><span className="mono">$2,500</span></div></Reveal>
      <Reveal show={beat>=5} className="verdict">NEGOTIATE</Reveal>
      <Reveal show={beat>=6} className="profit-note fine">$225 estimated profit · 9% margin</Reveal>
    </motion.div>
    <div className="example">Illustrative · rounded rates</div>
  </Shot>;
}
