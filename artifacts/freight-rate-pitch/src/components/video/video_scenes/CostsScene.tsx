import { motion } from 'framer-motion';
import { Shot, Reveal, useBeat, EASE } from '../Shot';

export function CostsScene() {
  const beat=useBeat([300,950,1600,2400,3100,3700,4200]);
  return <Shot name="costs" tone="ivory" tail={beat>=7} kind="split">
    <h1 className="chapter">Your costs.<br/>Your baseline.</h1>
    <div className="cost-lines">{[['Fixed','$0.40/mi'],['Fuel','$0.80/mi'],['Other variable','$0.80/mi']].map(([label,rate],i)=><Reveal show={beat>=i+1} key={label}><div className="cost-row"><span>{label}</span><span className="mono">{rate}</span></div></Reveal>)}</div>
    <motion.div className="cost-total" initial={{opacity:0,scale:.85}} animate={{opacity:beat>=4?1:0,scale:beat>=6?1.04:1}} transition={{duration:.5,ease:EASE}}>
      <div className="eyebrow">Operating cost</div><div className="amount mono">$2.00<span className="unit">/mi</span></div>
    </motion.div>
    <Reveal className="cost-caption" show={beat>=5}>Include every mile.</Reveal>
    <div className="example">Example figures</div>
  </Shot>;
}
