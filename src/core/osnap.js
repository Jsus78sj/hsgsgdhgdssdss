/* ═══ التقاط الكائنات ═══
   طبقة إدخال خالصة: تعينك على إصابة نقطة موجودة، ولا تحرّك شيئاً.
   المرجع المستورد يدخل المرشّحين آخراً وبتحيّزٍ مقصود ضدّه — نقطةُ
   جدارٍ رسمتَه تفوز على نقطة مرجعٍ استوردتَه عند التساوي. */
import {S} from "./state.js";
import {clamp} from "./units.js";
import {nearOnSeg,lineX} from "./geom.js";
import {dir,faces,isLow,isArc,arcPoint,arcMidPoint,arcNear,arcPerp} from "./walls.js";
import {arcParams,arcLineInt,arcArcInt,inSweep} from "./arcmath.js";
import {opensOf,span,openPt} from "./opens.js";
import {colPoly,colW} from "./cols.js";
import {stPolys,stGeoms} from "./stairs.js";
import {vis} from "./layers.js";
import {refSnap} from "./ref.js";
import * as SI from "./sindex.js";
import {ORD} from "./entreg.js";

export const MODES=[
 {k:"end", n:"نهاية", mk:"sq"},
 {k:"mid", n:"منتصف", mk:"tri"},
 {k:"cen", n:"مركز", mk:"cen"},
 {k:"int", n:"تقاطع", mk:"x"},
 {k:"nod", n:"عقدة",  mk:"plus"},
 {k:"per", n:"عمودي", mk:"per"},
 {k:"par", n:"موازٍ", mk:"parl"},
 {k:"tan", n:"مماس", mk:"tan"},
 {k:"near",n:"أقرب",  mk:"near"},
 {k:"ref", n:"مرجع",  mk:"ref"}];
export const MNAME={};
MODES.forEach(m=>{MNAME[m.k]=m.n});
export const osOn=()=>MODES.some(m=>+S.os[m.k]);
export const osSummary=()=>{
 const on=MODES.filter(m=>+S.os[m.k]);
 return on.length?on.map(m=>m.n).join(" · "):"لا أنماط";
};
/* الالتقاط على ما تراه: الطبقة المخفيّة لا تُلتقَط نقاطها */
const visW=w=>vis(isLow(w)?"A-WALL-LOW":"A-WALL");
const wallsVis=list=>(list||S.walls).filter(visW);
/* أقرب نقطةٍ على حلقةٍ من المؤشر — لقرب الأعمدة والدرج والمناطق */
const nearRing=(ring,x,y)=>{
 if(!ring||ring.length<2)return null;
 let best=null,bd=1/0;
 for(let i=0;i<ring.length;i++){
  const r=nearOnSeg(ring[i],ring[(i+1)%ring.length],x,y);
  if(r.d<bd){bd=r.d;best={p:r.p,d:r.d}}
 }
 return best;
};

/* نقطتا المماسّ من from إلى دائرة مركزها (cx,cy) ونصف قطرها R —
   زاويتان على الدائرة، أو فراغٌ إن كانت from داخل الدائرة أو عليها
   (لا مماسَّ حقيقياً منها حينئذٍ) */
function tangentFromPt(cx,cy,R,px,py){
 const dx=px-cx,dy=py-cy,d2=dx*dx+dy*dy,R2=R*R;
 if(d2<=R2+1e-6)return [];
 const d=Math.sqrt(d2);
 const alpha=Math.acos(clamp(R/d,-1,1));
 const theta=Math.atan2(dy,dx);
 return [theta+alpha,theta-alpha];
}

/* م٢أ: المرشّحون، الأوّل باختيار S.os.pick والباقي بالمسافة · o.only تجاوز */
const NP={near:1,per:1,par:1};
/* م٢ج: الأنماط النقطية المتقطّعة — لها أكثر من مرشّحٍ في النمط الواحد.
   أمّا near/per/par/cen/tan فنقطتُها دالّةٌ في المؤشّر أو الأساس، فواحدةٌ تكفي */
const DISC={end:1,mid:1,int:1,nod:1}, XMAX=6;
/* الأنواع التي تعلن snap(e): تُحسب مرّةً بعد تسجيل entreg لا في كل استعلام */
const SNDEF=ORD.filter(d=>d.snap), QK=["wall","col","stair","area"].concat(SNDEF.map(d=>d.k));
export function osnapAll(x,y,tol,from,o){
 const only=o&&o.only, on=k=>only?k===only:+S.os[k];
 if(!only&&!osOn())return [];
 const best={};
 /* نقطةُ الأساس نفسُها لا تُلتقَط: ضلعٌ طولُه صفر لا يريده أحد، و«مركز»
    القوس كان يخطف «نقطة على القوس» في «نصف قطر» فيُرفَض بـ«أقل من 10 مم» */
 const isBase=p=>from&&Math.hypot(p[0]-from[0],p[1]-from[1])<1;
 const more={};
 const T=(m,p,ex)=>{
  if(!on(m)||isBase(p))return;
  const d=Math.hypot(p[0]-x,p[1]-y);
  if(d>tol)return;
  const b=best[m];
  if(!b||d<b.d){
   /* م٢ج: الفائز السابق في نمطٍ نقطيٍّ يبقى مرشّحاً ثانياً (نهايتان متجاورتان) */
   if(b&&DISC[m])(more[m]||(more[m]=[])).push(b);
   best[m]=Object.assign({m,d,p:[Math.round(p[0]),Math.round(p[1])]},ex||{});
  }else if(DISC[m]){
   /* مرفوضٌ هنا لكنه قد يُعرض بالتدوير: مصفوفةٌ صغيرة، والكائن يُبنى لاحقاً للمختارين فقط */
   const a=more[m]||(more[m]=[]);
   if(a.length<16)a.push([d,p[0],p[1],ex]);
  }
 };
 /* ═══ مُلتَقطٌ بلا حدّ تفاوتٍ إلى المؤشّر ═══ للمركز والمماسّ: أن
    يقترب المؤشّر من الجسم (فيدخل الكيان مرشَّحي الفهرس أصلاً) كافٍ
    ليظهر مركزُه — ولو بعُد عنه كثيراً، كمركز قوسٍ كبير نصف قطره
    يفوق التفاوت. فرقُه عن T أنه لا يرفض بُعد الهدف عن المؤشّر،
    ويكتفي برفض الكيان البعيد (تصفية الفهرس أعلاه تكفلت بذلك). */
 const Tf=(m,p,ex)=>{
  if(!on(m)||isBase(p))return;
  const d=Math.hypot(p[0]-x,p[1]-y);
  if(!best[m]||d<best[m].d)
   best[m]=Object.assign(
    {m,d,p:[Math.round(p[0]),Math.round(p[1])]},ex||{});
 };
 /* المرشَّحون من الفهرس: نقطةٌ داخل تفاوتٍ تعني صندوقاً يقع فيه
    الكيان — فما خرج عنه لا يمكن أن يُلتقَط، والباقي يُفحَص كما كان */
 const box=SI.boxAt(x,y,tol);
 /* م٢ب: سؤالٌ واحد للفهرس بكل الأنواع — كان سؤالاً لكل نوع */
 const Q=SI.query(box,QK), es=k=>(Q[k]||[]).map(r=>r.e);
 const WV=wallsVis(es("wall"));
 /* الالتقاط على المسار المرسوم وعلى الوجهَين المحسوبَين */
 WV.forEach(w=>{
  T("end",w.a); T("end",w.b);
  /* ═══ الجدار القوسيّ ═══
     dir/faces تعملان على الوتر: منتصفُه ووجهاه ونقطتُه «الأقرب» كلُّها
     نقاطٌ لا تقع على الجسم. فيُلتقَط القوسُ نفسه: منتصفُه، وطرفا
     وجهَيه ومنتصفاهما (±t/2 عن المسار)، وأقربُ نقطةٍ عليه، وأقدامُ
     العمود منه. وليس للقوسيّ فتحات (addOpen ترفضها وensureShape تطرد
     ما تسلّل) فلا حدودَ فتحاتٍ تُلتقَط. */
  if(isArc(w)){
   const mp=arcMidPoint(w);
   if(mp)T("mid",mp);
   [w.t/2,-w.t/2].forEach(off=>{
    [0,1].forEach(u=>{const q=arcPoint(w,u,off); if(q)T("end",q)});
    const q=arcPoint(w,0.5,off);
    if(q)T("mid",q);
   });
   if(on("near")){
    const r=arcNear(w,x,y);
    if(r.d<=tol)T("near",r.p);
   }
   if(from&&on("per"))
    arcPerp(w,from[0],from[1]).forEach(q=>T("per",q,{from}));
   /* مركز القوس — نقطة مركز دائرته، لا نقطةٌ على المسار */
   if(on("cen")){
    const P=arcParams(w);
    if(P)Tf("cen",[P.cx,P.cy]);
   }
   /* المماسّ من نقطة الأساس إلى دائرة القوس — النقطتان اللتان لا
      تُعبَران عليهما إلّا ضمن مدى القوس فعلاً (inSweep) */
   if(from&&on("tan")){
    const P=arcParams(w);
    if(P)tangentFromPt(P.cx,P.cy,P.R,from[0],from[1]).forEach(th=>{
     if(inSweep(P,th))
      Tf("tan",[P.cx+P.R*Math.cos(th),P.cy+P.R*Math.sin(th)],{from});
    });
   }
   return;
  }
  T("mid",[(w.a[0]+w.b[0])/2,(w.a[1]+w.b[1])/2]);
  const F=faces(w);
  if(F){
   [F.l,F.r].forEach(f=>{
    T("end",f[0]); T("end",f[1]);
    T("mid",[(f[0][0]+f[1][0])/2,(f[0][1]+f[1][1])/2]);
   });
  }
  const d=dir(w);
  if(!d)return;
  const s=(x-w.a[0])*d.ux+(y-w.a[1])*d.uy;
  if(s>=0&&s<=d.L)T("near",[w.a[0]+d.ux*s,w.a[1]+d.uy*s]);
  if(from){
   const t=clamp((from[0]-w.a[0])*d.ux+(from[1]-w.a[1])*d.uy,0,d.L);
   T("per",[w.a[0]+d.ux*t,w.a[1]+d.uy*t],{from});
   /* ═══ الموازي ═══ نقطةٌ على شعاعٍ من نقطة الأساس يوازي هذا
      الجدار: إسقاطُ المؤشّر عليه. يُعرض متى ابتعد المؤشّرُ عن ذلك
      الشعاع أقلّ من التفاوت وتقدّم عن الأساس في الاتجاه. ولا
      يُقدَّم للقوسيّ: موازي قوسٍ مماسٌّ بندُ هندسةٍ أعمق من هذا. */
   if(on("par")){
    const dx=x-from[0], dy=y-from[1];
    const across=Math.abs(dx*d.uy-dy*d.ux);
    const along=dx*d.ux+dy*d.uy;
    if(across<=tol&&along>1)
     T("par",[from[0]+d.ux*along, from[1]+d.uy*along],{from});
   }
  }
  /* حدود الفتحات: مواضع مفيدة للقياس والرسم */
  opensOf(w.id).forEach(o=>{
   const [a,b]=span(o);
   T("end",openPt(w,a)); T("end",openPt(w,b));
   T("mid",openPt(w,o.s));
  });
 });
 /* أركان الأعمدة ومراكزها */
 if(vis("A-COLS"))es("col").forEach(c=>{
  const p=colPoly(c);
  if(!p)return;
  T("nod",[c.x,c.y]);
  if(c.kind!=="circ")p.forEach(q=>T("end",q));
  /* مركز العمود الدائريّ ومماسُّه وعموده — أعمدةٌ فقط، فالمستطيل
     زواياه end والتقاطعُ int يكفيانه */
  if(c.kind==="circ"){
   const Rc=colW(c)/2;
   if(on("cen"))Tf("cen",[c.x,c.y]);
   if(from&&on("per")){
    const dx=from[0]-c.x,dy=from[1]-c.y,d0=Math.hypot(dx,dy);
    if(d0>1e-6)T("per",[c.x+dx/d0*Rc,c.y+dy/d0*Rc],{from});
   }
   if(from&&on("tan"))
    tangentFromPt(c.x,c.y,Rc,from[0],from[1]).forEach(th=>
     Tf("tan",[c.x+Rc*Math.cos(th),c.y+Rc*Math.sin(th)],{from}));
  }
  if(on("near")){
   if(c.kind==="circ"){
    /* الدائرة الحقيقية لا مضلّعها الـ32 ضلعاً: أقرب نقطةٍ على
       محيط العمود من المؤشر تُحسب تحليلياً */
    const Rc=colW(c)/2;
    const dx=x-c.x, dy=y-c.y, d0=Math.hypot(dx,dy);
    if(d0>1e-6){
     const ux=dx/d0, uy=dy/d0;
     const q={p:[Math.round(c.x+ux*Rc),Math.round(c.y+uy*Rc)],
      d:Math.abs(d0-Rc)};
     T("near",q.p);
    }
   }else{
    const q=nearRing(p,x,y);
    if(q)T("near",q.p);
   }
  }
 });
 /* أركان الدرج */
 if(vis("A-STRS"))es("stair").forEach(s=>{
  stPolys(s).forEach(p=>{
   if(!p)return;
   p.forEach(q=>T("end",q));
   if(on("near")){const q=nearRing(p,x,y); if(q)T("near",q.p)}
  });
  stGeoms(s).forEach(g=>{T("end",g.a); T("end",g.b)});
 });
 /* رؤوس المناطق */
 if(vis("A-AREA"))es("area").forEach(a=>{
  a.ring.forEach(q=>T("end",q));
  if(on("near")){const q=nearRing(a.ring,x,y); if(q)T("near",q.p)}
 });
 /* م٢ب: كلُّ نوعٍ يعلن snap(e) في entreg — الخطّ المتعدّد والعناصر
    الإنشائية ونقاطُ تعريف الأبعاد — بحلقةٍ واحدةٍ وسؤالِ فهرسٍ واحد */
 SNDEF.forEach(d=>(Q[d.k]||[]).forEach(({e})=>{
  if(!vis(d.lay(e)))return;
  const o=d.snap(e);
  o.p.forEach(c=>T(c[0],c[1]));
  o.s.forEach(([a,b])=>{
   T("near",nearOnSeg(a,b,x,y).p);
   if(from)T("per",nearOnSeg(a,b,from[0],from[1]).p,{from});
  });
 }));
 /* تقاطع محاور الجدران — على المسارات لا الوجوه، والقوسيّ يدخل
    الحساب الآن بكل تراكيبه: خطّ-خطّ، وخطّ-قوس، وقوس-قوس */
 if(on("int")){
  const near=wallsVis(SI.entsIn(SI.boxAt(x,y,tol*4),"wall"))
   .filter(w=>isArc(w)
    ? arcNear(w,x,y).d<tol*4
    : nearOnSeg(w.a,w.b,x,y).d<tol*4)
   .slice(0,50);
  for(let i=0;i<near.length;i++)for(let j=i+1;j<near.length;j++){
   const wi=near[i], wj=near[j];
   let pts=[];
   if(isArc(wi)&&isArc(wj)){
    pts=arcArcInt(wi,wj);
   }else if(isArc(wi)&&!isArc(wj)){
    pts=arcLineInt(wi,wj.a,wj.b);
   }else if(!isArc(wi)&&isArc(wj)){
    pts=arcLineInt(wj,wi.a,wi.b);
   }else{
    const p=lineX(wi.a,wi.b,wj.a,wj.b);
    if(p){
     const on=q=>nearOnSeg(q.a,q.b,p[0],p[1]).d<2;
     if(on(wi)&&on(wj))pts=[p];
    }
   }
   pts.forEach(p=>T("int",p));
  }
 }
 /* عقد شبكة المحاور — الترشيح على المحور قبل التقاطع، فلا يُضرَب
    عددُ الحروف في عدد الأرقام */
 if(vis("A-GRID")){
  const X=S.grid.xs.filter(v=>Math.abs(v-x)<=tol);
  const Y=S.grid.ys.filter(v=>Math.abs(v-y)<=tol);
  X.forEach(gx=>Y.forEach(gy=>T("nod",[gx,gy])));
  /* م٢ب: الأقرب والعمودي على خطوط المحاور نفسها لا على عقدها وحدها —
     الخطّ لانهائيّ الامتداد كما يُقرأ المحور، فلا صندوقَ مشهدٍ يُبنى هنا */
  X.forEach(gx=>{T("near",[gx,y]); if(from)T("per",[gx,from[1]],{from})});
  Y.forEach(gy=>{T("near",[x,gy]); if(from)T("per",[from[0],gy],{from})});
 }

 /* المرجع آخر المرشّحين وبتحيّزٍ ضدّه ×1.05 */
 if(on("ref")&&vis("A-REFR")){
  const rf=refSnap(x,y,tol);
  if(rf&&(!best.ref||rf.d*1.05<best.ref.d))
   best.ref={m:"ref",d:rf.d*1.05,p:rf.p,kind:rf.kind};
 }
 const L=[],seen={};
 for(const m of MODES){const c=best[m.k],q=c&&c.p+"";
  if(c&&!seen[q]){seen[q]=1; L.push(c)}}
 if(!L.length)return L;
 /* م٢ج: باقي المرشّحين من النمط نفسه، بلا تكرارِ نقطةٍ عُرضت، وبسقفٍ
    يُبقي Tab عملياً — والأوّل (L[0]) لا يتغيّر بهذا الإلحاق */
 const X=[];
 for(const m of MODES)(more[m.k]||[]).forEach(c=>{
  const a=Array.isArray(c), d=a?c[0]:c.d;
  X.push([d,m.k,c,a])});
 X.sort((u,v)=>u[0]-v[0]);
 const n0=L.length;
 for(const [d,k,c,a] of X){
  if(L.length-n0>=XMAX)break;
  const o=a?Object.assign({m:k,d,p:[Math.round(c[1]),Math.round(c[2])]},c[3]||{}):c, q=o.p+"";
  if(!seen[q]){seen[q]=1; L.push(o)}
 }
 let f=L[0];
 if(S.os.pick==="near"){
  const P=L.filter(c=>!NP[c.m]);
  f=(P.length?P:L).reduce((a,c)=>c.d<a.d?c:a);
 }
 return [f].concat(L.filter(c=>c!==f).sort((a,b)=>a.d-b.d));
}
export const osnap=(x,y,tol,from,o)=>osnapAll(x,y,tol,from,o)[0]||null;
