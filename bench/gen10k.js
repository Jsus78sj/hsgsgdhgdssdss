/* ═══ مولّد مشروع الـ١٠ آلاف عنصر ═══ (م٠ · البوابة ب٠-٢)
   مصدرٌ واحد يستعمله الحارس في Node (src/tests/perf-osnap-10k.test.js)
   وصفحةُ القياس في المتصفح (bench/index.html)، فالرقمان عن المشروع نفسه.
   5100 جدار قصير + 2601 عمود (شبكة 51×51) + 2299 بُعداً، و3000 نقطة
   استعلام ببذرةٍ ثابتة. خارج حزمة الإقلاع: لا يستورده index.html. */
import * as ST from "../src/core/state.js";
import * as RN from "../src/core/render.js";
import * as W from "../src/core/walls.js";
import * as CO from "../src/core/cols.js";
import * as DM from "../src/core/dims.js";

export function rnd(seed){let t=seed>>>0; return()=>{t+=0x6D2B79F5; let r=Math.imul(t^t>>>15,1|t);
 r^=r+Math.imul(r^r>>>7,61|r); return((r^r>>>14)>>>0)/4294967296}}
export const stat=A=>{const s=A.slice().sort((a,b)=>a-b);
 return {mean:A.reduce((a,b)=>a+b,0)/A.length, p95:s[Math.floor(s.length*0.95)], max:s[s.length-1]}};
export function build10k(){
 ST.newState(); ST.ensureShape(); RN.invalidate();
 const r=rnd(10000), SP=4000, N=51;
 for(let i=0;i<5100;i++){
  const x=(i%N)*SP+500, y=Math.floor(i/N)*SP*0.5+300;
  W.addWall([x,y],[x+1800,y+(i%3)*300],150,"int","c");
 }
 for(let i=0;i<N;i++)for(let j=0;j<N;j++)
  CO.addCol("rect",[i*SP,j*SP],300,300,0,"conc");
 for(let i=0;i<2299;i++){
  const x=(i%N)*SP, y=Math.floor(i/N)*SP+2000;
  DM.addDim("h",[x,y],[x+SP,y],600);
 }
 ST.touchGeom(); RN.invalidate();
 const n=ST.S.walls.length+ST.S.cols.length+ST.S.dims.length;
 const ext=N*SP;
 const Q=[]; for(let i=0;i<3000;i++)Q.push([r()*ext,r()*ext]);
 return {n,Q,ext};
}
