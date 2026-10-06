import { motion } from 'framer-motion';
import { Shot, Reveal, useBeat, EASE } from '../Shot';

export function ActualsScene() {
  const beat=useBeat([350,900,1550,2300,3050,3800,4400,4950,5150]);
  return <Shot name="actuals" tone="sage" tail={beat>=9} kind="split">
    <h1 className="chapter">A quote is<br/>only the start.</h1>
    <motion.div className="results-panel" animate={{rotateY:beat>=9?7:0,scale:beat>=9?.98:1}} transition={{duration:.65,ease:EASE}}>
      <Reveal show={beat>=1} className="result-labels"><span>ESTIMATE / ACTUAL</span></Reveal>
      {[['Target','$2,857'],['Revenue','$3,000'],['Actual cost','$2,300'],['Fees','$90'],['Profit','$610']].map(([label,value],i)=><Reveal key={label} show={beat>=i+2}><div className="result-row"><span>{label}</span><span className="mono">{value}</span></div></Reveal>)}
    </motion.div>
    <Reveal show={beat>=7} className="margin-display"><span className="mono">20.3<span style={{fontSize:'9vmin'}}>%</span></span><span className="support">actual<br/>margin</span></Reveal>
    <Reveal show={beat>=8} className="actual-takeaway">Learn from every load.</Reveal>
    <div className="example" style={{bottom:'5%'}}>Illustrative figures</div>
  </Shot>;
}
