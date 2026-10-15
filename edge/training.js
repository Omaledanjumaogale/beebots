const sigmoid=x=>1/(1+Math.exp(-Math.max(-30,Math.min(30,x))));
export function trainCandidate(bars, incumbent=null) {
  const ordered=[...bars].filter(b=>Number.isFinite(b.close)&&b.close>0&&Number.isFinite(b.time)).sort((a,b)=>a.time-b.time);
  if (ordered.some((b,i)=>i>0&&b.time===ordered[i-1].time)) return {status:'skipped',reason:'duplicate timestamps'};
  if (ordered.length<1200) return {status:'skipped',reason:'requires 1200 closed chronological bars'};
  const rows=[];
  for(let i=20;i<ordered.length-1;i++) {
    const r=ordered[i].close/ordered[i-1].close-1;
    rows.push({x:[r,ordered[i].close/ordered[i-5].close-1,ordered[i].close/ordered[i-20].close-1],y:Number(ordered[i+1].close>ordered[i].close),r:ordered[i+1].close/ordered[i].close-1});
  }
  const split=Math.floor(rows.length*.7), train=rows.slice(0,split-1), test=rows.slice(split);
  const mean=[0,1,2].map(j=>train.reduce((s,r)=>s+r.x[j],0)/train.length);
  const sd=mean.map((m,j)=>Math.sqrt(train.reduce((s,r)=>s+(r.x[j]-m)**2,0)/train.length)||1);
  const features=r=>[1,...r.x.map((x,j)=>(x-mean[j])/sd[j])];
  let w=[0,0,0,0];
  for(let epoch=0;epoch<10;epoch++) for(const r of train) {
    const x=features(r), e=sigmoid(w.reduce((s,a,j)=>s+a*x[j],0))-r.y;
    w=w.map((a,j)=>a-.01*(e*x[j]+.001*a));
  }
  const score=model=>{
    let loss=0,net=0,trades=0;
    for(const r of test){
      const x=[1,...r.x.map((v,j)=>(v-model.mean[j])/model.sd[j])];
      const p=sigmoid(model.weights.reduce((s,a,j)=>s+a*x[j],0));
      loss+=(p-r.y)**2;
      if(p>.6||p<.4){net+=(p>.6?1:-1)*r.r-.004;trades++;}
    }
    return {brier:loss/test.length,netReturn:net,trades,samples:test.length};
  };
  const candidate={weights:w,mean,sd,type:'logistic-return-v1'}, metrics=score(candidate);
  const baseline=incumbent?score(incumbent):{brier:.25,netReturn:0};
  const promote=metrics.trades>=30&&metrics.brier<baseline.brier-.005&&metrics.netReturn>Math.max(0,baseline.netReturn)+.01;
  return {status:promote?'shadow-ready':'rejected',candidate,metrics,baseline,reason:'Chronological 70/30 split, one-bar purge, train-only scaler, 40bp round-trip fee/slippage cost; forward-paper validation required before activation'};
}
