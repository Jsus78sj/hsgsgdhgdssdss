/* ═══ م٢ب · تتبّع الكائنات والامتداد ═══ (خطة تطوير أدوات الرسم · ف٤)
   وحدةٌ كسولة: لا تدخل الإقلاع، يحمّلها canvas.js أوّلَ مرّةٍ يُشغَّل
   فيها التتبّع (S.rb.otrack) — فمن لا يستعمله لا يدفع ثمنه.

   النقاطُ المكتسبة (≤ MAX) تُكسَب بوقوفٍ DWELL م.ث على نقطة التقاط
   (أو بشريحة «تتبّع» في اللمس ثم نقرة)، والوقوفُ الثاني يزيلها. ومن كل
   نقطةٍ خطوطُ تتبّع: أفقيّ ورأسيّ (وبزيادات القطبي إن كان مفعّلاً)،
   وامتدادُ الجدار أو الخطّ المتعدّد أو الكمرة إن كانت النقطة طرفاً له.

   الأداء: الحساب من النقاط المكتسبة وحدها — ٥ نقاط × ≤ ٢٤ زاوية — فلا
   يمسّ الفهرس إلا مرّةً عند الاكتساب (لاستنتاج اتجاه الامتداد).

   الالتقاطُ العاديّ (osnap) يفوز دائماً: التتبّعُ يُسأل حين لا مرشّح. */
import {S} from "./state.js";
import {D2R,deg} from "./units.js";
import {trackAngles} from "./coords.js";
import {isArc} from "./walls.js";
import * as SI from "./sindex.js";

export const MAX=5, DWELL=400;
/* {p:[x,y], m:النمط, ext:[زوايا الامتداد بالدرجات]} — بترتيب الاكتساب */
export const ACQ=[];
const key=p=>Math.round(p[0])+","+Math.round(p[1]);
const ang=(a,b)=>deg(Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI);
const same=(a,b)=>a&&b&&Math.hypot(a[0]-b[0],a[1]-b[1])<2;

/* اتجاهاتُ الامتداد: كلُّ كيانٍ خطّيٍّ طرفُه هذه النقطة يمتدّ منها إلى
   الخارج (من الطرف الآخر نحوها). القوسيّ لا امتدادَ مستقيماً له. */
export function extOf(p){
 const A=[], add=(far,end)=>{if(!same(far,end))A.push(ang(far,end))};
 const Q=SI.query(SI.boxAt(p[0],p[1],2),["wall","pline","struct"]);
 (Q.wall||[]).forEach(({e:w})=>{
  if(isArc(w))return;
  if(same(w.a,p))add(w.b,w.a); else if(same(w.b,p))add(w.a,w.b);
 });
 (Q.pline||[]).forEach(({e:l})=>{
  const P=l.pts||[], n=P.length, B=l.bulge||[];
  if(n<2||l.closed===1)return;
  if(same(P[0],p)&&!+B[0])add(P[1],P[0]);
  else if(same(P[n-1],p)&&!+B[n-2])add(P[n-2],P[n-1]);
 });
 (Q.struct||[]).forEach(({e})=>{
  if(e.kind!=="beam"||!e.a||!e.b)return;
  if(same(e.a,p))add(e.b,e.a); else if(same(e.b,p))add(e.a,e.b);
 });
 return [...new Set(A.map(a=>+a.toFixed(6)))];
}
/* اكتسابٌ أو إزالة: «add» · «del» — والسادسة تُخرج أقدمَها */
export function acquire(c){
 if(!c||!c.p)return null;
 const k=key(c.p), i=ACQ.findIndex(a=>key(a.p)===k);
 if(i>=0){ACQ.splice(i,1); return "del"}
 if(ACQ.length>=MAX)ACQ.shift();
 ACQ.push({p:[Math.round(c.p[0]),Math.round(c.p[1])], m:c.m||null, ext:extOf(c.p)});
 return "add";
}
export function clear(){ACQ.length=0; DW.k=null}

/* ═══ الوقوف ═══ دالّةٌ على الزمن لا على المؤقّت، فتُختبَر بلا انتظار:
   canvas.js يناديها مع كل حركة ومع مؤقّتٍ بعد DWELL. «أقرب» و«موازٍ»
   لا تُكتسَب: نقطةٌ تتبع المؤشّر لا معنى لتثبيتها مرجعاً. */
const DW={k:null,t:0,done:0};
export function dwell(c,now){
 if(!c||!c.p||c.m==="near"||c.m==="par"){DW.k=null; return null}
 const k=key(c.p);
 if(k!==DW.k){DW.k=k; DW.t=now; DW.done=0; return null}
 if(DW.done||now-DW.t<DWELL)return null;
 DW.done=1;
 return acquire(c);
}

/* خطوطُ نقطةٍ مكتسبة: {o,a,ux,uy,ext} */
function linesOf(A,mode,inc,extra){
 const L=[];
 (trackAngles(mode==="polar"?"polar":"ortho",inc,extra)||[]).forEach(a=>L.push({a,ext:0}));
 /* امتدادٌ يوافق خطَّ تتبّعٍ قائماً يُعلَّم عليه (فيُوسَم «امتداد») ولا يتكرّر */
 A.ext.forEach(a=>{const l=L.find(l=>Math.abs(l.a-a)<1e-6); if(l)l.ext=1; else L.push({a,ext:1})});
 return L.map(l=>({o:A.p,a:l.a,ext:l.ext,ux:Math.cos(l.a*D2R),uy:Math.sin(l.a*D2R)}));
}
/* تقاطع خطّين: نقطةٌ أو null (المتوازيان) — t على كلٍّ منهما */
function cross(l,m){
 const den=l.ux*m.uy-l.uy*m.ux;
 if(Math.abs(den)<1e-9)return null;
 const dx=m.o[0]-l.o[0], dy=m.o[1]-l.o[1];
 const t=(dx*m.uy-dy*m.ux)/den, s=(dx*l.uy-dy*l.ux)/den;
 return {p:[l.o[0]+l.ux*t,l.o[1]+l.uy*t],t,s};
}
const R=p=>[Math.round(p[0]),Math.round(p[1])];

/* ═══ السؤال ═══ o: {base, ray(°)|null, mode, inc, extra}
   ⇒ {p, m:"trk"|"trk2", lines:[…], dd:{o,u}|null} أو null.
   · مع شعاعٍ من الأساس (تعامد · قطبي · قفل زاوية): النتيجةُ على الشعاع
     نفسه — تقاطعُه مع خطّ تتبّعٍ قرب إسقاط المؤشّر عليه. فلا يميل الجدار.
   · بلا شعاع: تقاطعُ خطّي تتبّع قرب المؤشّر، وإلا أقربُ خطّ (إسقاطٌ عليه)
     ومعه dd: المسافة المباشرة على الخطّ من نقطته المكتسبة. */
export function trackSnap(x,y,tol,o){
 o=o||{};
 if(!ACQ.length)return null;
 const L=[];
 ACQ.forEach(A=>linesOf(A,o.mode,o.inc,o.extra).forEach(l=>L.push(l)));
 const b=o.base;
 if(b&&o.ray!=null){
  const r={o:b,a:o.ray,ux:Math.cos(o.ray*D2R),uy:Math.sin(o.ray*D2R),ext:0};
  const tq=Math.max(0,(x-b[0])*r.ux+(y-b[1])*r.uy);
  const q=[b[0]+r.ux*tq,b[1]+r.uy*tq];
  let best=null;
  L.forEach(l=>{
   if(same(l.o,b))return;
   const c=cross(r,l);
   if(!c||c.t<1||c.s<-1)return;
   const d=Math.hypot(c.p[0]-q[0],c.p[1]-q[1]);
   if(d<=tol&&(!best||d<best.d))best={d,p:c.p,l};
  });
  return best?{p:R(best.p),m:"trk2",lines:[r,best.l],dd:null}:null;
 }
 /* الخطوطُ القريبة من المؤشّر، أمامَ نقطتها (شعاعٌ لا خطٌّ مزدوج) */
 const N=[];
 L.forEach(l=>{
  const t=(x-l.o[0])*l.ux+(y-l.o[1])*l.uy;
  if(t<=0)return;
  const d=Math.abs((x-l.o[0])*l.uy-(y-l.o[1])*l.ux);
  if(d<=tol)N.push(Object.assign({t,d},l));
 });
 if(!N.length)return null;
 let best=null;
 for(let i=0;i<N.length;i++)for(let j=i+1;j<N.length;j++){
  if(same(N[i].o,N[j].o))continue;
  const c=cross(N[i],N[j]);
  if(!c)continue;
  const d=Math.hypot(c.p[0]-x,c.p[1]-y);
  if(d<=tol&&(!best||d<best.d))best={d,p:c.p,ls:[N[i],N[j]]};
 }
 if(best)return {p:R(best.p),m:"trk2",lines:best.ls,dd:null};
 const l=N.reduce((a,c)=>c.d<a.d?c:a);
 return {p:R([l.o[0]+l.ux*l.t,l.o[1]+l.uy*l.t]),m:"trk",lines:[l],
  dd:{o:l.o.slice(),u:[l.ux,l.uy]}};
}
/* وسمُ الشريط: «تتبّع 90° من نهاية» أو «تقاطع تتبّع» */
export const label=r=>!r?"":r.m==="trk2"?"تقاطع تتبّع"
 :`${r.lines[0].ext?"امتداد":"تتبّع"} ${+r.lines[0].a.toFixed(2)}°`;
export const stateOf=()=>({n:ACQ.length,on:!!+S.rb.otrack});
