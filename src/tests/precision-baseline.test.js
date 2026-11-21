/* ═══ خط أساس الدقة ═══ (م٠ · خطة تطوير أدوات الرسم §١-٢أ · البوابة ب٠-١)
   التخزين بالمليمتر الصحيح (Math.round عند الإنشاء). هذا الملف يثبّت ما
   يعطيه ذلك اليوم عبر أداة الجدار الحقيقية وسطر الأوامر:
   · ٣٥٩ جداراً قطبياً نسبياً: خطأ الطول ≤ 1 مم، وخطأ الزاوية ≤ atan(0.71/L).
   · «5<30» المطلق و«@3.1<30» النسبي.
   · مضلّعات منتظمة بإدخال نسبي: فجوة الإغلاق 0.
   · مسار عشوائي (بذرة ثابتة) من ١٠٠ ضلع: الانحراف التراكمي ≤ DRIFT_REF.
     كان 2.899 مم على 2.11.0 قبل م١ب؛ «القلم الدقيق» (م١ب) أنزله إلى 0.289
     فصار DRIFT_REF = 1 مم (معيار ب٠-١). والثمن المعلوم: الرأسان مقرَّبان
     كلٌّ منهما ≤ 0.71 مم، فخطأ اتجاه الضلع حدّه atan(1.41/L) لا atan(0.71/L).
   · الأمر C يغلق على النقطة الأولى تماماً، والأداة تبقى فعّالة.
   · الملحق ١٤-٣ (قُلب في م٢أ): كان ui/canvas.js#snap يقدّم الالتقاط على
     التعامد وقفل الزاوية فيميل الجدار 32.01°. الآن المرشّح البعيد عن الشعاع
     يُترَك، والقريب منه (≤ التفاوت) يُسقَط عليه. يُقاس بالدالة الحقيقية.
   التشغيل: node src/tests/precision-baseline.test.js                 */
import {shim,shimCanvas,shimDOM,toolRig,group,ok,eq,near,summary} from "./harness.js";
import {readdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
shim(); shimCanvas(); shimDOM();
const HERE=fileURLToPath(new URL(".",import.meta.url));
const ST=await import("../core/state.js");
const RN=await import("../core/render.js");
for(const f of readdirSync(HERE+"../tools").filter(f=>f.endsWith(".js")))await import(`../tools/${f}`);
const R=await import("../tools/registry.js");
const rig=toolRig(R,{invalidate:()=>RN.invalidate()});
const S=()=>ST.S;
const D2R=Math.PI/180;

/* حدّ الانحراف التراكمي (مم) — معيار ب٠-١ بعد م١ب (المقيس 0.289 مم) */
export const DRIFT_REF=1.0;

function fresh(){ST.newState(); ST.ensureShape(); RN.invalidate(); rig.clear(); rig.defs("wall")}
const len=w=>Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]);
const angOf=w=>Math.atan2(w.b[1]-w.a[1],w.b[0]-w.a[0])/D2R;
const dAng=(a,b)=>{let d=((a-b)%360+540)%360-180; return Math.abs(d)};
/* بذرةٌ ثابتة: mulberry32 */
function rnd(seed){let t=seed>>>0; return()=>{t+=0x6D2B79F5; let r=Math.imul(t^t>>>15,1|t);
 r^=r+Math.imul(r^r>>>7,61|r); return((r^r>>>14)>>>0)/4294967296}}
const M=v=>String(+v.toFixed(4));
export const MEAS={};

group("٣٥٩ جداراً قطبياً @L<a بزوايا 1°..359° وأطوال 1..10 م",()=>{
 fresh();
 let eL=0, eA=0, eAn=0, n=0;
 for(let a=1;a<=359;a++){
  const L=1+((a*37)%91)/10;            /* 1.0 .. 10.0 م، موزّعةٌ بلا ترتيب */
  const ox=(a%20)*25000, oy=Math.floor(a/20)*25000;
  R.begin("wall"); rig.at(ox,oy); rig.type(`@${M(L)}<${a}`); rig.esc();
  const w=S().walls[S().walls.length-1];
  if(!w||w.a[0]!==ox||w.a[1]!==oy)continue;
  n++;
  eL=Math.max(eL,Math.abs(len(w)-L*1000));
  const ea=dAng(angOf(w),a);
  eA=Math.max(eA,ea);
  eAn=Math.max(eAn,ea/(Math.atan(Math.SQRT1_2/(L*1000))/D2R));
 }
 eq(n,359,"كلُّ الجدران أُنشئت");
 ok(eL<=1,`أقصى خطأ في الطول ${eL.toFixed(3)} مم ≤ 1 مم`);
 ok(eAn<=1.0001,`أقصى خطأ زاوية ${eA.toFixed(4)}° ضمن الحدّ النظري atan(0.71/L)`);
 MEAS.polar={n,maxLenErr:+eL.toFixed(3),maxAngErr:+eA.toFixed(4)};
});

group("«5<30» مطلق و«@3.1<30» نسبي",()=>{
 fresh();
 R.begin("wall"); rig.at(0,0); rig.type("5<30"); rig.esc();
 const w=S().walls[0];
 eq(JSON.stringify(w.b),"[4330,2500]","5<30 → (4330, 2500)");
 near(len(w),5000,0.2,`الطول ${len(w).toFixed(2)} مم`);
 fresh();
 R.begin("wall"); rig.at(0,0); rig.type("@3.1<30"); rig.esc();
 eq(JSON.stringify(S().walls[0].b),"[2685,1550]","@3.1<30 → (2685, 1550)");
});

group("مضلّعات منتظمة بإدخال نسبي: الإغلاق 0 مم",()=>{
 MEAS.polygons={};
 for(const N of [4,6,20,50,100]){
  fresh();
  const L=N<=6?4:(N<=20?1.5:0.6);
  R.begin("wall"); rig.at(0,0);
  let ex=[0,0], dev=0;
  for(let i=0;i<N;i++){
   const a=+(i*360/N).toFixed(4);
   rig.type(`@${L}<${a}`);
   ex=[ex[0]+L*1000*Math.cos(a*D2R), ex[1]+L*1000*Math.sin(a*D2R)];
   const w=S().walls[S().walls.length-1];
   dev=Math.max(dev,Math.hypot(w.b[0]-ex[0],w.b[1]-ex[1]));
  }
  rig.esc();
  eq(S().walls.length,N,`${N} ضلعاً`);
  const last=S().walls[N-1];
  const gap=Math.hypot(last.b[0],last.b[1]);
  eq(gap,0,`${N} ضلعاً: فجوة الإغلاق 0 مم (أقصى انحراف رأس ${dev.toFixed(2)} مم)`);
  MEAS.polygons[N]={gap,maxVertexDev:+dev.toFixed(2)};
 }
});

group("مسارٌ عشوائيّ من ١٠٠ ضلع (بذرة 20261029) ثم C",()=>{
 fresh();
 const r=rnd(20261029);
 R.begin("wall"); rig.at(0,0);
 let ex=[0,0], eAng=0, eAn=0, made=0;
 for(let i=0;i<100;i++){
  const L=+(0.5+r()*6).toFixed(3), a=+(r()*360).toFixed(2);
  const n0=S().walls.length;
  rig.type(`@${L}<${a}`);
  ex=[ex[0]+L*1000*Math.cos(a*D2R), ex[1]+L*1000*Math.sin(a*D2R)];
  if(S().walls.length>n0){made++;
   const ea=dAng(angOf(S().walls[S().walls.length-1]),a);
   eAng=Math.max(eAng,ea);
   eAn=Math.max(eAn,ea/(Math.atan(Math.SQRT2/(L*1000))/D2R));}
 }
 eq(made,100,"١٠٠ ضلع أُنشئت");
 const tip=S().walls[S().walls.length-1].b;
 const drift=Math.hypot(tip[0]-ex[0],tip[1]-ex[1]);
 ok(eAn<=1.0001,`أقصى خطأ زاوية ${eAng.toFixed(4)}° ضمن atan(1.41/L) لكل ضلع (القلم الدقيق)`);
 ok(drift<=DRIFT_REF,`انحراف آخر رأس ${drift.toFixed(2)} مم ≤ المرجع ${DRIFT_REF} مم`);
 console.log(`   ◦ الانحراف التراكمي المقيس: ${drift.toFixed(3)} مم (معيار ب٠-١ بعد م١: ≤ 1 مم)`);
 rig.type("c");
 const c=S().walls[S().walls.length-1];
 eq(JSON.stringify(c.b),"[0,0]","C يغلق على (0,0) تماماً");
 eq(S().walls.length,101,"والضلعُ الذي يغلق رقمه 101");
 rig.esc();
 MEAS.random={sides:100,drift:+drift.toFixed(3),maxAngErr:+eAng.toFixed(4)};
});

group("مربع 4 م بثلاثة أضلاع ثم C",()=>{
 fresh();
 R.begin("wall"); rig.at(0,0);
 ["@4<0","@4<90","@4<180"].forEach(s=>rig.type(s)); rig.type("c");
 eq(S().walls.length,4,"أربعة جدران");
 eq(JSON.stringify(S().walls[3].b),"[0,0]","الضلع الرابع ينتهي على (0,0)");
 ok(!!R.active(),"والأداة تبقى فعّالة لسلسلةٍ جديدة");
 rig.esc();
});

/* ═══ الملحق ١٤-٣ · التعامد والقفل مقابل الالتقاط ═══ (يُستورد ui/canvas.js آخراً
   كي لا تمسّ آثارُه الجانبية المجموعاتِ أعلاه) */
{
 const doc=globalThis.document;
 for(const id of ["top","srchBtn","ribbon","tools","navbar","fabDock","thumb","qpCard","status",
  "touchBar","optbar","log","side","sideE","cv"]){
  if(doc.getElementById&&doc.getElementById(id))continue;
  const e=doc.createElement(id==="cv"?"canvas":"div"); e.setAttribute("id",id); doc.body.appendChild(e);
 }
 if(!globalThis.window)globalThis.window={prompt:()=>null,confirm:()=>true};
 const CV=await import("../ui/canvas.js");
 const W=await import("../core/walls.js");
 const rig2=toolRig(R,{invalidate:()=>RN.invalidate()});
 group("الملحق ١٤-٣ (م٢أ): التعامد وقفل الزاوية يُقدَّمان على الالتقاط البعيد عن الشعاع",()=>{
  ST.newState(); ST.ensureShape(); RN.invalidate(); rig2.clear(); rig2.defs("wall");
  W.addWall([5000,3200],[9000,3200],150,"int","c"); ST.touchGeom(); RN.invalidate();
  CV.V.k=0.05;                          /* 20 مم/بكسل ⇒ تفاوت الالتقاط 320 مم */
  const rb=Object.assign({},S().rb), os=Object.assign({},S().os);
  S().rb.ortho=1; S().rb.snap=1; S().rb.polar=0; S().os.end=1;
  const from=[0,0], cur=[5050,3150];
  const pOrthoOnly=(()=>{S().rb.snap=0; const p=CV.snap(cur[0],cur[1],from); S().rb.snap=1; return p})();
  eq(JSON.stringify(pOrthoOnly),"[5050,0]","التعامد وحده: النقطة على الشعاع الأفقي (5050, 0)");
  const p=CV.snap(cur[0],cur[1],from);
  eq(JSON.stringify(p),"[5050,0]","مع الالتقاط: الطرف البعيد عن الشعاع لا يخطف النقطة (كان (5000,3200))");
  ok(!CV.UI.osnap,"ولا مرشّح معروض");
  /* عبر أداة الجدار الحقيقية: الضلع أفقيّ */
  R.begin("wall"); rig2.at(0,0); const q=CV.snap(cur[0],cur[1],R.snapBase()); rig2.at(q[0],q[1],cur); rig2.esc();
  const w=S().walls[S().walls.length-1];
  const a=Math.atan2(w.b[1]-w.a[1],w.b[0]-w.a[0])/D2R;
  ok(Math.abs(a)<1e-9,`جدارٌ بالتعامد المفعَّل يُرسم ${a.toFixed(2)}° (كان 32.01°)`);
  /* قفل الزاوية المكتوب (<0) يُحترَم كذلك */
  R.T.lock=0; const pl=CV.snap(cur[0],cur[1],from); R.T.lock=null;
  eq(pl[1],0,`قفل الزاوية <0 مع الالتقاط: (${pl}) على الشعاع`);
  /* مرشّحٌ قريبٌ من الشعاع يُسقَط عليه: طولُ الضلع من الالتقاط واتجاهُه من التعامد */
  W.addWall([5000,0],[5000,-2000],150,"int","c"); ST.touchGeom(); RN.invalidate();
  const pn=CV.snap(5005,150,[0,100]);
  ok(CV.UI.osnap&&CV.UI.osnap.m==="end",`مرشّحٌ قرب الشعاع يبقى ملتقَطاً (${CV.UI.osnap&&CV.UI.osnap.m})`);
  ok(pn[1]===100&&pn[0]===5050,`ويُسقَط على الشعاع y=100: (${pn}) من الطرف (5050, 0)`);
  /* بلا نقطة أساس (أول نقطة) لا تقييد: الالتقاط كما كان */
  const p0=CV.snap(cur[0],cur[1],null);
  eq(JSON.stringify(p0),"[5000,3125]","بلا أساس: الالتقاط الحرّ على ركن الوجه كما كان");
  MEAS.orthoVsSnap={orthoOnly:pOrthoOnly,withSnap:p,wallAngle:+a.toFixed(2),lockWithSnap:pl,nearRay:pn};
  Object.assign(S().rb,rb); Object.assign(S().os,os);
 });
}

console.log("\nالقياسات:",JSON.stringify(MEAS));
process.exit(summary()?1:0);
