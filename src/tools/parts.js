/* ═══ أدوات الأعمدة والأدوات الصحية والدرج ═══
   كلّها تبقى فعّالة حتى Esc، وكلّها تخزّن إحداثيات صريحة:
   «ألصِق بالجدار» أمرٌ يُنفَّذ عند الوضع لا رابطةٌ تُحفَظ. */
import {S} from "../core/state.js";
import {m3,clamp,dm2} from "../core/units.js";
import {pip,convexHit} from "../core/geom.js";
import {band} from "../core/walls.js";
import {axLabel} from "../core/dims.js";
import {addCol,nextTag,colLabel,CK,CT,colOnWall,colById} from "../core/cols.js";
import {addFix,snapToWall,FK,fixName,FREE_KINDS} from "../core/fixt.js";
import {addStair,addStairL,addStairU,stCheck} from "../core/stairs.js";
import {addBeam,addFooting,addSlab,nextStrTag,strLabel,strLen,
        strArea,strVol,strPoly} from "../core/struct.js";
import {regionLoops} from "../core/render.js";
import {regionAt} from "../core/areas.js";
import {levelOf,activeLevel} from "../core/level.js";
import {defTool,H,rec,ov,ovLen,ovNum,ovOn,
        T,pvLine,pvPoly} from "./registry.js";

const GRN="#5cd98e", YEL="#ffd06b", BLU="#5aa9ff", RED="#ff6f6f";
const RCT=(p,w,h,rot,c)=>{
 const a=(rot||0)*Math.PI/180, ca=Math.cos(a), sa=Math.sin(a);
 const Q=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]]
  .map(q=>[p[0]+q[0]*ca-q[1]*sa, p[1]+q[0]*sa+q[1]*ca]);
 return Q.map((q,i)=>({t:"l",a:q,b:Q[(i+1)%4],c}));
};
const selectedCols=()=>{
 const selection=H.sel()||[],ids=selection.filter(x=>x&&x.k==="col").map(x=>x.id);
 const L=activeLevel(S.meta),inLevel=c=>levelOf(c)===L;
 const picked=ids.map(colById).filter(c=>c&&inLevel(c));
 if(ids.length){
  if(!picked.length)throw new Error("لا أعمدة محددة في الطابق النشط");
  return picked;
 }
 return S.cols.filter(inLevel);
};
const rectPts=(p,w,h,rot)=>RCT(p,w,h,rot,GRN).map(x=>x.a);
/* عمقُ تداخل مستطيلين محدّبين (أقلّ تراكبٍ على محاور SAT) بالمم */
const penetration=(A,B)=>{
 let best=Infinity;
 for(const P of [A,B])for(let i=0;i<P.length;i++){
  const a=P[i],b=P[(i+1)%P.length],nx=a[1]-b[1],ny=b[0]-a[0],l=Math.hypot(nx,ny)||1;
  const pr=Q=>{let lo=Infinity,hi=-Infinity;Q.forEach(v=>{const d=(v[0]*nx+v[1]*ny)/l;lo=Math.min(lo,d);hi=Math.max(hi,d)});return [lo,hi]};
  const u=pr(A),v=pr(B);
  best=Math.min(best,Math.min(u[1],v[1])-Math.max(u[0],v[0]));
 }
 return Math.max(0,best);
};
const footingTargets=()=>{
 const cols=selectedCols();
 if(!cols.length)throw new Error("لا أعمدة في التحديد أو المشروع");
 const w=ovLen("footing","w")||1500,h=ovLen("footing","h")||w,r=ovNum("footing","rot");
 const out=cols.map(c=>({p:[c.x,c.y],w,h,rot:r,src:c.id}));
 const polys=out.map(x=>rectPts(x.p,x.w,x.h,x.rot));
 for(let i=0;i<polys.length;i++)for(let j=0;j<i;j++)
  if(convexHit(polys[i],polys[j],-1))
   throw new Error(`القاعدتان تحت ${out[j].src} و${out[i].src} تتداخلان بـ${m3(penetration(polys[i],polys[j]))} م — قلّل العرض أو استعمل قاعدة مشتركة`);
 for(const old of S.struct.filter(x=>x.kind==="footing")){
  const p=strPoly(old);
  if(p&&polys.some(q=>convexHit(p,q,-1)))
   throw new Error(`قاعدة قائمة ${old.tag||old.id} تتداخل مع قاعدة مقترحة بـ${m3(Math.max(...polys.map(q=>penetration(p,q))))} م — قلّل المقاس`);
 }
 return out;
};
const gridBeamTargets=()=>{
 const X=S.grid.xs||[],Y=S.grid.ys||[];
 if(!X.length||!Y.length)throw new Error("لا محاور — أنشئ محوراً رأسياً وأفقياً أولاً");
 const C=S.cols.filter(c=>levelOf(c)===activeLevel(S.meta)), tol=50, out=[], seen=new Set();
 const add=(a,b,axis)=>{
  const aa=`${Math.round(a.x)},${Math.round(a.y)}`,bb=`${Math.round(b.x)},${Math.round(b.y)}`;
  const key=[aa,bb].sort().join("|");
  if(seen.has(key))return;seen.add(key);out.push({a:[a.x,a.y],b:[b.x,b.y],axis});
 };
 Y.forEach((y,i)=>{
  const row=C.filter(c=>Math.abs(c.y-y)<=tol).sort((a,b)=>a.x-b.x);
  if(row.length<2)throw new Error(row.length?`المحور ${axLabel("y",i)} عليه عمود واحد فقط (${row[0].id}) — الكمرة تحتاج عمودين`:`المحور ${axLabel("y",i)} بلا أعمدة`);
  for(let j=0;j+1<row.length;j++)add(row[j],row[j+1],axLabel("y",i));
 });
 X.forEach((x,i)=>{
  const col=C.filter(c=>Math.abs(c.x-x)<=tol).sort((a,b)=>a.y-b.y);
  if(col.length<2)throw new Error(col.length?`المحور ${axLabel("x",i)} عليه عمود واحد فقط (${col[0].id}) — الكمرة تحتاج عمودين`:`المحور ${axLabel("x",i)} بلا أعمدة`);
  for(let j=0;j+1<col.length;j++)add(col[j],col[j+1],axLabel("x",i));
 });
 return out;
};
/* حلقاتٌ بسيطة من محاور الكمرات المغلقة؛ تكفي الحلقة المستطيلة
   وتُرفض الشبكات المتفرعة بدلاً من تخمين حدودها. */
function beamLoops(){
 const L=activeLevel(S.meta);
 const beams=S.struct.filter(e=>levelOf(e)===L&&e.kind==="beam"&&e.a&&e.b),nodes=new Map(),edges=[];
 const node=p=>{
  const x=Math.round(p[0]/5)*5,y=Math.round(p[1]/5)*5,k=`${x},${y}`;
  if(!nodes.has(k))nodes.set(k,{p:[x,y],edges:[]});
  return k;
 };
 beams.forEach(e=>{
  const a=node(e.a),b=node(e.b);if(a===b)return;
  const i=edges.length;edges.push({a,b});
  nodes.get(a).edges.push(i);nodes.get(b).edges.push(i);
 });
 const seen=new Set(),loops=[];
 for(const start of nodes.keys()){
  if(seen.has(start))continue;
  const comp=[],queue=[start];seen.add(start);
  while(queue.length){
   const k=queue.pop();comp.push(k);
   for(const i of nodes.get(k).edges){
    const q=edges[i].a===k?edges[i].b:edges[i].a;
    if(!seen.has(q)){seen.add(q);queue.push(q)}
   }
  }
  if(comp.length<3||comp.some(k=>nodes.get(k).edges.length!==2))continue;
  const ring=[],used=new Set();let at=comp[0],prev=-1;
  while(true){
   ring.push(nodes.get(at).p);
   const ei=nodes.get(at).edges.find(i=>i!==prev&&!used.has(i));
   if(ei==null)break;
   used.add(ei);const e=edges[ei],next=e.a===at?e.b:e.a;
   if(next===comp[0])break;
   prev=ei;at=next;
   if(ring.length>comp.length)break;
  }
  if(ring.length===comp.length&&used.size===comp.length)loops.push(ring);
 }
 return loops;
}
const slabRingAt=p=>{
 const wallRing=regionAt(regionLoops(),p[0],p[1]);
 if(wallRing)return wallRing;
 return beamLoops().filter(r=>pip(r,p[0],p[1]))
  .sort((a,b)=>Math.abs(a.reduce((s,q,i)=>s+q[0]*a[(i+1)%a.length][1]-a[(i+1)%a.length][0]*q[1],0))
   -Math.abs(b.reduce((s,q,i)=>s+q[0]*b[(i+1)%b.length][1]-b[(i+1)%b.length][0]*q[1],0)))[0]||null;
};
/* ═══ العناصرُ الإنشائية: كمرةٌ وقاعدةٌ وبلاطة ═══ §٣/١٢
   ثلاثُ أدواتٍ لا واحدةٌ بخيارِ نوع: الكمرةُ تُرسَم بطرفَين، والقاعدةُ
   بنقرةٍ واحدةٍ، والبلاطةُ بحلقةٍ من النقاط — فمدخلاتُها مختلفةٌ
   أصلاً، وأداةٌ واحدةٌ تبدّل عددَ خطواتها بحسب خيارٍ تُربك.
   وكلُّها على طبقةِ A-STRU المتقطّعة (انظر core/struct.js). */
defTool({
 id:"beam", alias:"bm كمره كمرة جسر", label:"كمرة",
 hint:"طرفانِ · المقطعُ من الشريط · Enter ينهي",
 opts:[
  {k:"w",label:"العرض م",type:"len",def:"0.25"},
  {k:"d",label:"العمق م",type:"len",def:"0.50"},
  {k:"mat",label:"المادّة",type:"sel",
   items:[["conc","خرسانة"],["steel","حديد"]],def:"conc"},
  {k:"tag",label:"الوسم",type:"text",def:"",
   hint:"فارغ = ترقيمٌ تلقائيٌّ B1 B2"},
  {k:"grid",label:"على المحاور",type:"chk",def:0,
   hint:"معاينة ثم Enter: يصل الأعمدة المتتالية على كل محور"}],
 start(ctx){
  if(!ovOn("beam","grid"))return;
  ctx.targets=gridBeamTargets();
  if(!ctx.targets.length)throw new Error("لا توجد كمرات بين أعمدة المحاور");
  T.steps=[{p:`معاينة ${ctx.targets.length} كمرة · Enter للتأكيد`,confirm:1,
   each(c){
    let made=0;
    c.targets.forEach(q=>{
     const e=addBeam(q.a,q.b,ovLen("beam","w"),ovLen("beam","d"),
      ov("beam","mat"),String(ov("beam","tag")||"").trim()||nextStrTag("B"));
     rec(c,e,"struct");made++;
    });
    H.rep("ok",`أُنشئت ${made} كمرة على المحاور — خطوة واحدة`);
   }}];
 },
 steps:[
  {p:"الطرف الأول"},
  {p:"الطرف الثاني (Enter ينهي)", loop:1, base:-1,
   each(ctx,p){
    const a=ctx.pts[ctx.pts.length-2];
    const tg=String(ov("beam","tag")||"").trim()||nextStrTag("B");
    const e=addBeam(a,p,ovLen("beam","w"),ovLen("beam","d"),
     ov("beam","mat"),tg);
    rec(ctx,e,"struct");
    H.rep("ok",`${e.id} ${strLabel(e)} · الطول ${m3(strLen(e))} م`
     +` · ${(strVol(e)/1e9).toFixed(3)} م³`);
   }}],
 prev(ctx,g){
  if(ctx.targets)return ctx.targets.flatMap(q=>{
   const a=q.a,b=q.b,w=ovLen("beam","w")||250,dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy);
   if(L<1)return [];
   const nx=-dy/L*w/2,ny=dx/L*w/2;
   const p=[[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],
    [b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]];
   return p.map((x,i)=>pvLine(x,p[(i+1)%4],GRN));
  });
  if(!ctx.pts.length||!g)return [];
  const a=ctx.pts[ctx.pts.length-1];
  const w=ovLen("beam","w")||250;
  const L=Math.hypot(g[0]-a[0],g[1]-a[1]);
  if(L<1)return [];
  const ux=(g[0]-a[0])/L, uy=(g[1]-a[1])/L, nx=-uy, ny=ux, hw=w/2;
  const P=(s,v)=>[a[0]+ux*s+nx*v, a[1]+uy*s+ny*v];
  return [
   pvLine(P(0,hw),P(L,hw),GRN), pvLine(P(0,-hw),P(L,-hw),GRN),
   pvLine(P(0,-hw),P(0,hw),GRN), pvLine(P(L,-hw),P(L,hw),GRN),
   pvLine(a,g,YEL)];
 }});

defTool({
 id:"footing", alias:"ft قاعده قاعدة", label:"قاعدة",
 hint:"انقر مركزَ القاعدة — المقاسُ من الشريط · Enter ينهي",
 opts:[
  {k:"w",label:"العرض م",type:"len",def:"1.50"},
  {k:"h",label:"الطول م",type:"len",def:"",
   hint:"فارغ = مربّعةٌ مثلُ العرض"},
  {k:"th",label:"السماكة م",type:"len",def:"0.40"},
  {k:"rot",label:"الدوران °",type:"num",def:0},
  {k:"tag",label:"الوسم",type:"text",def:"",
   hint:"فارغ = ترقيمٌ تلقائيٌّ F1 F2"},
  {k:"on",label:"تحت الأعمدة",type:"sel",
   items:[["none","يدوي"],["cols","كل الأعمدة المحددة"]],def:"none"}],
 start(ctx){
  if(ov("footing","on")!=="cols")return;
  ctx.targets=footingTargets();
  T.steps=[{p:`معاينة ${ctx.targets.length} قاعدة · Enter للتأكيد`,confirm:1,
   each(c){
    let made=0;
    c.targets.forEach(q=>{
     const e=addFooting(q.p,q.w,q.h,q.rot,ovLen("footing","th"),
      "conc",String(ov("footing","tag")||"").trim()||nextStrTag("F"));
     rec(c,e,"struct");made++;
    });
    H.rep("ok",`أُنشئت ${made} قاعدة تحت الأعمدة — خطوة واحدة`);
   }}];
 },
 steps:[
  {p:"مركز القاعدة (Enter ينهي)", base:"none", loop:1,
   each(ctx,p){
    const w=ovLen("footing","w");
    const tg=String(ov("footing","tag")||"").trim()||nextStrTag("F");
    const e=addFooting(p,w,ovLen("footing","h")||w,
     ovNum("footing","rot"),ovLen("footing","th"),
     "conc",tg);
    rec(ctx,e,"struct");
    H.rep("ok",`${e.id} ${strLabel(e)} · `
     +`${(strArea(e)/1e6).toFixed(2)} م² · `
     +`${(strVol(e)/1e9).toFixed(2)} م³`);
   }}],
 prev(ctx,g){
  if(ctx.targets)return ctx.targets.flatMap(q=>{
   const Q=rectPts(q.p,q.w,q.h,q.rot);
   return Q.map((p,i)=>pvLine(p,Q[(i+1)%Q.length],GRN))
    .concat([pvLine(Q[0],Q[2],GRN),pvLine(Q[1],Q[3],GRN)]);
  });
  if(!g)return [];
  const w=ovLen("footing","w")||1500;
  const o=RCT(g,w,ovLen("footing","h")||w,ovNum("footing","rot"),GRN);
  /* قطرانِ كما تُرسَم فعلاً — فالشبحُ يطابق الناتج */
  o.push({t:"l",a:o[0].a,b:o[2].a,c:GRN});
  o.push({t:"l",a:o[1].a,b:o[3].a,c:GRN});
  return o;
 }});

defTool({
 id:"slab", alias:"sl بلاطه بلاطة", label:"بلاطة",
 hint:"انقر رؤوسَ البلاطةِ ثم Enter — ثلاثةُ رؤوسٍ على الأقل",
 opts:[
  {k:"th",label:"السماكة م",type:"len",def:"0.15"},
  {k:"tag",label:"الوسم",type:"text",def:"",
   hint:"فارغ = ترقيمٌ تلقائيٌّ S1 S2"},
  {k:"pick",label:"التقاط حلقة",type:"chk",def:0,
   hint:"نقرة داخل حلقة مغلقة من الجدران أو الكمرات"}],
 start(){
  if(ovOn("slab","pick"))T.steps=[{p:"انقر داخل حلقة الجدران أو الكمرات",
   base:"none",autoFinish:1,each(ctx,p){
    const ring=slabRingAt(p);
    if(!ring)throw new Error("لا توجد حلقة مغلقة من الجدران أو الكمرات حول النقطة");
    const tg=String(ov("slab","tag")||"").trim()||nextStrTag("S");
    const e=addSlab(ring,ovLen("slab","th"),"conc",tg);
    rec(ctx,e,"struct");
    H.rep("ok",`${e.id} ${strLabel(e)} · ${(strArea(e)/1e6).toFixed(2)} م²`);
   }}];
 },
 steps:[
  {p:"الرأس الأول"},
  {p:"الرأسُ التالي (ثلاثةٌ على الأقلّ ثم Enter)", loop:1, base:-1}],
 /* `done` خُطّافُ الأداةِ لا الخطوة — كـ`cloud`: الحلقةُ تُغلَق عند
    Enter مرّةً واحدةً، لا عند كلِّ نقرة. */
 done(ctx){
  if(ovOn("slab","pick"))return;
  if(ctx.pts.length<3)
   throw new Error("البلاطةُ تحتاج ثلاثةَ رؤوسٍ على الأقل");
  const tg=String(ov("slab","tag")||"").trim()||nextStrTag("S");
  const e=addSlab(ctx.pts,ovLen("slab","th"),"conc",tg);
  rec(ctx,e,"struct");
  H.rep("ok",`${e.id} ${strLabel(e)} · `
   +`${(strArea(e)/1e6).toFixed(2)} م² · `
   +`${(strVol(e)/1e9).toFixed(2)} م³`);
 },
 prev(ctx,g){
  if(ovOn("slab","pick")&&g){
   const ring=slabRingAt(g);
   return ring?[pvPoly(ring,GRN,0)]:[];
  }
  const P=ctx.pts.slice();
  if(g)P.push(g);
  if(P.length<2)return [];
  const o=[];
  for(let i=0;i+1<P.length;i++)o.push(pvLine(P[i],P[i+1],GRN));
  /* الإغلاقُ يُرسَم من الآن: البلاطةُ حلقةٌ دائماً، فإظهارُ الوترِ
     الأخيرِ قبل Enter يُظهِر المساحةَ الحقيقيةَ لا المفتوحة. */
  if(P.length>2)o.push(pvLine(P[P.length-1],P[0],YEL));
  return o;
 }});

/* ═══ عمود ═══ */
defTool({
 id:"col", alias:"k عمود", label:"عمود",
 hint:"انقر مركز العمود · Enter ينهي",
 opts:[
  {k:"kind",label:"الشكل",type:"sel",
   items:[["rect","مستطيل"],["circ","دائري"]],def:"rect"},
  {k:"w",   label:"العرض / القطر م",type:"len",def:"0.3"},
  {k:"h",   label:"العمق م",        type:"len",def:"0.3",
   when:o=>o.kind!=="circ"},
  {k:"rot", label:"الدوران °",      type:"num",def:0,
   when:o=>o.kind!=="circ"},
  {k:"type",label:"المادة",type:"sel",
   items:[["conc","خرسانة"],["steel","حديد"],["stone","حجر"]],
   def:"conc"},
  {k:"tag", label:"رقّم تلقائياً",type:"chk",def:1}],
 steps:[
  {p:"مركز العمود (Enter ينهي)", base:"none", loop:1,
   each(ctx,p){
    const kind=ov("col","kind");
    const c=addCol(kind,p,ovLen("col","w"),ovLen("col","h"),
     ovNum("col","rot"),ov("col","type"),
     ovOn("col","tag")?nextTag("C"):"");
    rec(ctx,c,"cols");
    const on=colOnWall(c,2);
    H.rep("ok",`${c.id}${c.tag?" "+c.tag:""} ${CK[c.kind]} `
     +`${colLabel(c)} · ${CT[c.type]}`
     +(on?` · يُدمَج مع ${on}`:` · منفرد`));
   }}],
 prev(ctx,g){
  if(!g)return [];
  const w=ovLen("col","w");
  if(ov("col","kind")==="circ"){
   const r=w/2, o=[];
   let pr=null;
   for(let i=0;i<=24;i++){
    const a=i/24*Math.PI*2;
    const q=[g[0]+r*Math.cos(a), g[1]+r*Math.sin(a)];
    if(pr)o.push({t:"l",a:pr,b:q,c:GRN});
    pr=q;
   }
   return o;
  }
  return RCT(g,w,ovLen("col","h")||w,ovNum("col","rot"),GRN);
 }});

/* ═══ ما لا يُلصَق بالجدار افتراضاً ═══ (مسحُ ما قبل المرحلة ٦)
   الإلصاقُ يلتقط أقربَ جدارٍ ضمن 1.5 م، وكان مفعَّلاً لكلّ الـ36: إنارةُ
   سقفٍ أو مروحةٌ أو طاولةٌ على بُعد متر من الجدار تُنقَل إلى وجهه وتُدار.
   ما يُعلَّق بالسقف أو يقف حرّاً في الغرفة يبدأ حرّاً، والخيارُ باقٍ لمن أراده. */
const FREE=FREE_KINDS;
/* ═══ أداة صحية ═══ */
function mkFix(id,alias,label,kind){
 const d=FK[kind];
 defTool({
  id, alias, label,
  hint:"انقر الموضع — يُلصَق بأقرب جدار إن فُعّل الخيار",
  /* ═══ ترتيبُ الحقولِ هو ما يظهر ═══ المرحلة ٦: الثلاثةُ الأولى
     ظاهرةٌ والباقي وراءَ «المزيد». وهذا التعريفُ وحدَه يُنشئ ٣٦ أداةً،
     فترتيبُه هنا يُصلِح ٣٦ شريطاً في موضعٍ واحد.
     والظاهرُ هو **الوضعُ** (لصوقٌ · دورانٌ · عكسٌ): يتغيّر مع كلِّ
     إدراجٍ. والمخفيُّ هو **المقاسُ** (عرضٌ · عمقٌ): رمزُ الأثاثِ
     والكهرباءِ مقاسٌ قياسيٌّ يُضبَط مرّةً ولا يُلمَس بعدها. */
  opts:[
   {k:"snap",label:"ألصِق بالجدار",type:"chk",def:FREE.has(kind)?0:1,
    hint:"أمرٌ عند الوضع لا رابطة تُحفَظ"},
   {k:"rot", label:"الدوران °",type:"num",def:0},
   {k:"mir", label:"معكوسة",type:"chk",def:0},
   {k:"w",   label:"العرض م",type:"len",def:String(d.w/1000)},
   {k:"d",   label:"العمق م",type:"len",def:String(d.d/1000)}],
  steps:[
   {p:"موضع الأداة (Enter ينهي)", base:"none", loop:1,
    each(ctx,p){
     let at=p, rot=ovNum(id,"rot"), on=null;
     if(ovOn(id,"snap")){
      const s=snapToWall(p,1500);
      if(s){at=s.p; rot=s.rot; on=s.wall}
     }
     const f=addFix(kind,at,rot,{
      w:ovLen(id,"w"), d:ovLen(id,"d"),
      mir:ovOn(id,"mir")?1:0});
     rec(ctx,f,"fixt");
     H.rep("ok",`${f.id} ${fixName(f)} `
      +`${dm2(f.w,f.d,"م")}`
      +(on?` · مُلصَقة بـ ${on} (إحداثيات صريحة بعدها)`
        :` · حرّة`));
    }}],
  prev(ctx,g){
   if(!g)return [];
   let at=g, rot=ovNum(id,"rot");
   if(ovOn(id,"snap")){
    const s=snapToWall(g,1500);
    if(s){at=s.p; rot=s.rot}
   }
   const w=ovLen(id,"w")||d.w, dd=ovLen(id,"d")||d.d;
   const a=rot*Math.PI/180, ca=Math.cos(a), sa=Math.sin(a);
   const m=ovOn(id,"mir")?-1:1;
   const P=(u,v)=>[at[0]+(u*m)*ca-v*sa, at[1]+(u*m)*sa+v*ca];
   const Q=[P(-w/2,0),P(w/2,0),P(w/2,dd),P(-w/2,dd)];
   const o=Q.map((q,i)=>({t:"l",a:q,b:Q[(i+1)%4],c:GRN}));
   o.push({t:"l",a:P(0,0),b:P(0,dd*0.3),c:YEL});  /* دلالة الظهر */
   return o;
  }});
}
mkFix("wc",    "كرسي مرحاض", "كرسي",   "wc");
mkFix("lav",   "مغسله",      "مغسلة",  "lav");
mkFix("shower","دش",         "دُش",     "shower");
mkFix("tub",   "بانيو حوض",  "بانيو",  "tub");
mkFix("sink",  "مجلى",       "حوض مطبخ","sink");
mkFix("bidet", "شطاف",       "شطّاف",   "bidet");
mkFix("ur",    "مبوله",      "مبولة",  "ur");
mkFix("wm",    "غساله",      "غسّالة",  "wm");
mkFix("fd",    "صفايه",      "صفاية",  "fd");

/* ═══ الأثاث والكهرباء ═══ P-جديد (الأولوية ٥ و٦)
   نفسُ المصنع: لا مسارَ ثانيَ للوضع ولا لِلإلصاق ولا للمعاينة —
   فما يصحّ على المغسلة يصحّ على السرير والفيشة بلا نسخةٍ ثانية.
   والمعرّفاتُ مسبوقةٌ بـ`f`/`e` فلا تزاحم أداةً قائمةً (`tv` كانت
   ستزاحم أمر العرض، و`ac` اختصاراً محتملاً).
   والطبقةُ من النوع نفسِه (`fkLay`) فلا تُكرَّر هنا. */
const FURN=[
 ["fbed1",  "سرير_مفرد",     "سرير_مفرد",    "bed1"],
 ["fbed2",  "سرير_مزدوج",    "سرير_مزدوج",   "bed2"],
 ["fsofa2", "كنبه_مقعدين",   "كنبة مقعدين",  "sofa2"],
 ["fsofa3", "كنبه_ثلاثه",    "كنبة ثلاثة",   "sofa3"],
 ["ftable", "طاوله_مستطيله",          "طاولة مستطيلة","tablr"],
 ["ftablec","طاوله_دائريه",  "طاولة دائرية", "tablc"],
 ["fchair", "كرسي_جلوس",     "كرسي",         "chair"],
 ["fdesk",  "مكتب",           "مكتب",         "desk"],
 ["fwardr", "خزانه_ملابس",   "خزانة ملابس",  "wardr"],
 ["fkcab",  "خزانه_مطبخ",    "خزانة مطبخ",   "kcab"],
 ["ffridge","ثلاجه",          "ثلاجة",        "fridge"],
 ["fstove", "بوتاجاز_فرن",   "بوتاجاز",      "stove"]];
const ELEC=[
 ["esw1",  "مفتاح",           "مفتاح مفرد",   "sw1"],
 ["esw2",  "مفتاح_مزدوج",    "مفتاح_مزدوج",  "sw2"],
 ["eswd",  "مفتاح_باهت","مفتاح باهت",  "swd"],
 ["esoc",  "فيشه_بريزه",     "فيشة عادية",   "soc"],
 ["esoc2", "فيشه_مزدوجه",    "فيشة مزدوجة",  "soc2"],
 ["esocw", "فيشه_محميه",     "فيشة محميّة",  "socw"],
 ["elamp", "اناره_سقف",     "إنارة سقف",    "lampc"],
 ["elampw","اناره_جدار",     "إنارة جدار",   "lampw"],
 ["espot", "سبوت",            "سبوت",         "spot"],
 ["efan",  "مروحه_سقف",           "مروحة سقف",    "fan"],
 ["eexfan","شفاط",            "شفّاط",        "exfan"],
 ["edb",   "لوحه_توزيع",     "لوحة توزيع",   "db"],
 ["etel",  "هاتف_شبكه",      "نقطة هاتف/شبكة","tel"],
 ["etv",   "تلفاز_نقطه",     "نقطة تلفاز",   "tv"],
 ["eac",   "مكيف_سبليت",     "مكيّف سبليت",  "ac"]];
FURN.concat(ELEC).forEach(([id,alias,label,kind])=>
 mkFix(id,alias,label,kind));

/* ═══ أعمدة على تقاطعات المحاور ═══
   أمرٌ يُنفَّذ مرّة على S.grid: لكل تقاطعٍ عمودٌ بمقاسك، بترتيب
   القراءة العربية (من أعلى اليمين) فيأتي الترقيم منتظماً.
   ما وُجد عمودُه يُتخطّى ويُذكَر — لا تكرار ولا إزاحة صامتة. */
defTool({
 id:"gridcols", alias:"gk اعمده_المحاور شبكه_اعمده",
 label:"أعمدة المحاور",
 hint:"عمود على كل تقاطع محورين — الموجود يُتخطّى ولا يُزاح · المقاس: gk w=0.3 h=0.5",
 opts:[
  {k:"kind",label:"الشكل",type:"sel",
   items:[["rect","مستطيل"],["circ","دائري"]],def:"rect"},
  {k:"w",   label:"العرض / القطر م",type:"len",def:"0.4"},
  {k:"h",   label:"العمق م",type:"len",def:"0.4",
   when:o=>o.kind!=="circ"},
  {k:"rot", label:"الدوران °",type:"num",def:0,
   when:o=>o.kind!=="circ"},
  {k:"type",label:"المادة",type:"sel",
   items:[["conc","خرسانة"],["steel","حديد"],["stone","حجر"]],
   def:"conc"},
  {k:"pre", label:"سابقة الوسم",type:"text",def:"C"},
  {k:"tag", label:"رقّم",type:"chk",def:1},
  {k:"inside",label:"داخل الجدران وحدها",type:"chk",def:0,
   hint:"يشترط أن يقع التقاطع في جسم جدار"}],
 start(ctx){
  const X=S.grid.xs, Y=S.grid.ys;
  if(!X.length||!Y.length){
   H.rep("wr","تحتاج محوراً رأسياً وأفقياً على الأقلّ — "
    +"استعمل أداة «محور»");
   return false;
  }
  const N=X.length*Y.length;
  if(N>400){
   H.rep("er",`${N} تقاطعاً — أكثر من 400. امسح محاور أو نفّذها `
    +`على دفعات`);
   return false;
  }
  const inside=ovOn("gridcols","inside");
  const bands=inside?S.walls.map(band).filter(Boolean):null;
  const P=[];
  X.forEach((x,i)=>Y.forEach((y,j)=>P.push({x,y,i,j})));
  /* من أعلى اليمين: y نازلاً ثم x نازلاً — كترقيم renumberCols */
  P.sort((a,b)=>(b.y-a.y)||(b.x-a.x));
  const kind=ov("gridcols","kind");
  const pre=String(ov("gridcols","pre")||"C");
  let made=0, dup=0, out=0;
  const dupIds=[];
  P.forEach(q=>{
   if(bands&&!bands.some(bp=>pip(bp,q.x,q.y))){out++; return}
   try{
    const c=addCol(kind,[q.x,q.y],
     ovLen("gridcols","w"), ovLen("gridcols","h"),
     ovNum("gridcols","rot"), ov("gridcols","type"),
     ovOn("gridcols","tag")?nextTag(pre):"");
    rec(ctx,c,"cols");
    made++;
   }catch(e){
    dup++;
    dupIds.push(`${axLabel("x",q.i)}${axLabel("y",q.j)}`);
   }
  });
  H.rep(made?"ok":"wr",`${made} عموداً على ${N} تقاطعاً · `
   +`${colLabel({kind,w:ovLen("gridcols","w"),
     h:ovLen("gridcols","h")})}`);
  if(dup)H.rep("in",`تُخطّي ${dup} تقاطعاً عليه عمود سلفاً`
   +(dupIds.length<=12?`: ${dupIds.join(" · ")}`:""));
  if(out)H.rep("in",`تُخطّي ${out} تقاطعاً خارج الجدران`);
  return false;                    /* أمر لحظي — لا خطوات */
 },
 steps:[]});

/* ═══ درج ═══ */
defTool({
 id:"stair", alias:"st درج سلم", label:"درج",
 hint:"بداية القِلعة ثم نهايتها · القياسات تُقاس ولا تُصحَّح",
 opts:[
  {k:"w",  label:"العرض م",   type:"len",def:"1.1"},
  {k:"n",  label:"عدد القوائم",type:"num",def:16},
  {k:"h",  label:"ارتفاع الدور م",type:"len",def:"",
   hint:"فارغ = من إعداد المشروع"},
  {k:"up", label:"الاتجاه",type:"sel",
   items:[["up","صاعد"],["dn","هابط"]],def:"up"},
  {k:"cut",label:"خطّ القطع",type:"num",def:0,
   hint:"0 = بلا · 0.6 = عند 60٪"}],
 steps:[
  {p:"بداية القِلعة"},
  {p:"نهاية القِلعة", base:0, restart:1,
   each(ctx,p){
    const st=addStair(ctx.pts[0],p, ovLen("stair","w"),
     ovNum("stair","n"),
     {h:ovLen("stair","h")||0, up:ov("stair","up"),
      cut:ovNum("stair","cut")});
    rec(ctx,st,"stairs");
    const c=stCheck(st);
    H.rep(c.ok?"ok":"wr",
     `${st.id} ${c.n} قائمة · ق ${m3(c.rise)} · ن ${m3(c.tread)} م `
     +`· 2ق+ن ${m3(c.rule)} م`);
    c.msgs.forEach(m=>H.rep("wr","  "+m));
    if(!c.ok)H.rep("in","  القياسات كما رسمتها — عدّل الطول أو "
     +"عدد القوائم إن شئت");
   }}],
 prev(ctx,g){
  if(!ctx.pts.length||!g)return [];
  const a=ctx.pts[0];
  const w=ovLen("stair","w")||1100;
  const n=clamp(Math.round(ovNum("stair","n"))||2,2,80);
  const dx=g[0]-a[0], dy=g[1]-a[1], L=Math.hypot(dx,dy);
  if(L<1)return [];
  const ux=dx/L, uy=dy/L, nx=-uy, ny=ux, hw=w/2;
  const P=(s,v)=>[a[0]+ux*s+nx*v, a[1]+uy*s+ny*v];
  const o=[pvLine(P(0,-hw),P(L,-hw),GRN),
           pvLine(P(0, hw),P(L, hw),GRN)];
  const t=L/(n-1);
  for(let i=0;i<=n-1;i++)
   o.push(pvLine(P(t*i,-hw),P(t*i,hw),(t<250)?RED:BLU));
  return o;
 }});

/* ═══ درج L وU — رحلتان وبسطة ═══
   الرحلة الواحدة تُرسَم بنقطتين. عدد القوائم (n) لكل رحلة. */
const stairOpts=()=>[
 {k:"w",  label:"العرض م",   type:"len",def:"1.1"},
 {k:"n",  label:"قوائم كل رحلة",type:"num",def:8},
 {k:"h",  label:"ارتفاع الدور م",type:"len",def:"",
  hint:"فارغ = من إعداد المشروع"},
 {k:"up", label:"الاتجاه",type:"sel",
  items:[["up","صاعد"],["dn","هابط"]],def:"up"}];
function stairReport(st){
 const c=stCheck(st);
 H.rep(c.ok?"ok":"wr",
  `${st.id} ${st.type} ${c.n} قائمة · ق ${m3(c.rise)} · ن ${m3(c.tread)} م `
  +`· 2ق+ن ${m3(c.rule)} م`);
 c.msgs.forEach(m=>H.rep("wr","  "+m));
 if(!c.ok)H.rep("in","  القياسات كما رسمتها — عدّل الطول أو عدد القوائم إن شئت");
}
/* معاينة رحلةٍ من a إلى b بعرض w وعدد قوائم n */
function flightPrev(a,b,w,n){
 const dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy);
 if(L<1)return [];
 const ux=dx/L, uy=dy/L, nx=-uy, ny=ux, hw=w/2;
 const P=(s,v)=>[a[0]+ux*s+nx*v, a[1]+uy*s+ny*v];
 const o=[pvLine(P(0,-hw),P(L,-hw),GRN),pvLine(P(0,hw),P(L,hw),GRN)];
 const t=L/(n-1);
 for(let i=0;i<=n-1;i++)
  o.push(pvLine(P(t*i,-hw),P(t*i,hw),(t<250)?RED:BLU));
 return o;
}
const stN=k=>clamp(Math.round(ovNum(k,"n"))||2,2,80);

defTool({
 id:"stairl", alias:"stl درجL", label:"درج L",
 hint:"بداية الرحلة 1 · نقطة المنعطف · نهاية الرحلة 2",
 opts:stairOpts(),
 steps:[
  {p:"بداية الرحلة 1"},
  {p:"نقطة المنعطف", base:0},
  {p:"نهاية الرحلة 2", base:1, restart:1,
   each(ctx,p){
    const [a,b]=ctx.pts;
    const n=ovNum("stairl","n");
    const st=addStairL(a,b,p, ovLen("stairl","w"), n,n,
     {h:ovLen("stairl","h")||0, up:ov("stairl","up")});
    rec(ctx,st,"stairs");
    stairReport(st);
   }}],
 prev(ctx,g){
  const P=ctx.pts;
  if(!P.length||!g)return [];
  const w=ovLen("stairl","w")||1100, n=stN("stairl");
  if(P.length===1)return flightPrev(P[0],g,w,n);
  return flightPrev(P[0],P[1],w,n).concat(flightPrev(P[1],g,w,n));
 }});

defTool({
 id:"stairu", alias:"stu درجU", label:"درج U",
 hint:"بداية 1 · نهاية 1 · بداية 2 · نهاية 2",
 opts:stairOpts(),
 steps:[
  {p:"بداية الرحلة 1"},
  {p:"نهاية الرحلة 1", base:0},
  {p:"بداية الرحلة 2"},
  {p:"نهاية الرحلة 2", base:2, restart:1,
   each(ctx,p){
    const [a,b,c]=ctx.pts;
    const n=ovNum("stairu","n");
    const st=addStairU(a,b,c,p, ovLen("stairu","w"), n,n,
     {h:ovLen("stairu","h")||0, up:ov("stairu","up")});
    rec(ctx,st,"stairs");
    stairReport(st);
   }}],
 prev(ctx,g){
  const P=ctx.pts;
  if(!P.length||!g)return [];
  const w=ovLen("stairu","w")||1100, n=stN("stairu");
  if(P.length===1)return flightPrev(P[0],g,w,n);
  if(P.length===2)return flightPrev(P[0],P[1],w,n);
  if(P.length===3)return flightPrev(P[0],P[1],w,n)
   .concat(flightPrev(P[2],g,w,n));
  return [];
 }});
