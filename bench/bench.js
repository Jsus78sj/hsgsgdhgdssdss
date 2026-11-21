/* ═══ صفحة القياس للمتصفح ═══ (م٠ · خطة تطوير أدوات الرسم · البوابة ب٠-٢)
   المعايير: osnap p95 ≤ 1 م.ث على سطح المكتب و≤ 4 م.ث على هاتف متوسط،
   وبناء المشهد بعد تعديل جدار واحد على ١٠ آلاف عنصر ≤ 250 م.ث على سطح المكتب.
   «زمن الإطار» هنا: بناءُ المشهد المخبَّأ + طلاءُ أوّلياته على قماشٍ 800×600
   برسّامٍ مبسَّط (خطوط ومضلّعات) — تقريبٌ للرسم الفعلي في ui/canvas.js لا بديلٌ عنه.
   والزرّ الثاني يقيس بالرسّام الحقيقي: يفتح التطبيق في نافذةٍ من الأصل نفسه
   ويحقن bench/inapp.js فيها (الحفظ معلَّق هناك، فمشروعك المحفوظ لا يُمسّ).
   دقة المؤقّت: المتصفّحات تقرّب performance.now (0.1 م.ث في Chrome بلا عزلٍ عابر
   للأصول، وأخشن أحياناً)، فالالتقاطُ يُقاس أيضاً بدفعاتٍ من 10 استعلامات ويُكتب
   مقدارُ الدقة المقيس؛ والبوابة تُحسب من الدفعات إن كانت الدقة أخشن من 0.05 م.ث.
   CSP: لا سكربت مضمَّن، فالصفحة تعمل تحت _headers كما هي. */
import * as ST from "../src/core/state.js";
import * as RN from "../src/core/render.js";
import * as OS from "../src/core/osnap.js";
import * as EN from "../src/core/ents.js";
import * as SI from "../src/core/sindex.js";
import {build10k,stat} from "./gen10k.js";

const $=id=>document.getElementById(id);
const f=v=>+v.toFixed(3);
const S=o=>({mean:f(o.mean),p95:f(o.p95),max:f(o.max)});
const LIM={desktop:{osnap:1,scene:250},"phone-mid":{osnap:4,scene:null},
 "phone-low":{osnap:null,scene:null},"phone-high":{osnap:null,scene:null}};
let LAST=null;
const tick=()=>new Promise(r=>requestAnimationFrame(()=>r()));

function timeQ(Q,fn){for(let i=0;i<200;i++)fn(Q[i]);
 const T=[]; for(const q of Q){const t0=performance.now(); fn(q); T.push(performance.now()-t0)} return stat(T)}
/* دفعاتٌ من B استعلاماً: متوسطُ الاستعلام في كل دفعة — يتجاوز دقة المؤقّت */
function timeB(Q,fn,B=10){const T=[]; for(let i=0;i+B<=Q.length;i+=B){const t0=performance.now();
 for(let j=i;j<i+B;j++)fn(Q[j]); T.push((performance.now()-t0)/B)} return stat(T)}
/* أصغرُ فرقٍ غير صفريّ بين قراءتين متتاليتين = دقة المؤقّت الفعلية */
function timerRes(){let m=1/0; for(let i=0;i<300;i++){const a=performance.now(); let b=a;
 while(b===a)b=performance.now(); m=Math.min(m,b-a)} return +m.toFixed(4)}
function paint(ctx,P,B){
 const w=ctx.canvas.width,h=ctx.canvas.height;
 ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,w,h);
 if(!B)return;
 const k=Math.min(w/(B.x1-B.x0||1),h/(B.y1-B.y0||1))*0.95;
 ctx.setTransform(k,0,0,-k,-B.x0*k,h+B.y0*k); ctx.lineWidth=1/k; ctx.strokeStyle="#333";
 ctx.beginPath();
 for(const g of P){
  if(g.a&&g.b){ctx.moveTo(g.a[0],g.a[1]); ctx.lineTo(g.b[0],g.b[1])}
  else if(Array.isArray(g.pts)&&g.pts.length>1){ctx.moveTo(g.pts[0][0],g.pts[0][1]);
   for(let i=1;i<g.pts.length;i++)ctx.lineTo(g.pts[i][0],g.pts[i][1])}
 }
 ctx.stroke();
}
async function run(){
 $("run").disabled=true; $("out").textContent="يبني المشروع…"; await tick();
 const dev=$("dev").value, out={device:dev,model:$("model").value||"",ua:navigator.userAgent,
  when:new Date().toISOString(),dpr:devicePixelRatio,timerResMs:timerRes()};
 let t0=performance.now(); const G=build10k(); out.buildMs=f(performance.now()-t0); out.n=G.n;
 SI.grid();
 $("out").textContent="يقيس الالتقاط…"; await tick();
 out.osnapDefault=S(timeQ(G.Q,q=>OS.osnap(q[0],q[1],320)));
 out.osnapWide=S(timeQ(G.Q,q=>OS.osnap(q[0],q[1],560)));
 out.osnapBatch10=S(timeB(G.Q,q=>OS.osnap(q[0],q[1],320)));
 out.hitTest=S(timeQ(G.Q,q=>EN.hitTest(q[0],q[1],280)));
 const T=[]; for(let i=0;i<5;i++){ST.touchGeom(); t0=performance.now(); SI.grid(); T.push(performance.now()-t0)}
 out.sindexRebuild=S(stat(T));
 $("out").textContent="يقيس المشهد…"; await tick();
 RN.scene();
 const SC=[];
 for(let i=0;i<5;i++){const w=ST.S.walls[100+i]; w.b=[w.b[0]+100,w.b[1]]; ST.touchGeom(); RN.invalidate();
  t0=performance.now(); RN.scene(); SC.push(performance.now()-t0); await tick()}
 out.sceneAfterMove=S(stat(SC));
 const ctx=$("cv").getContext("2d"), FR=[];
 for(let i=0;i<30;i++){t0=performance.now(); const sc=RN.scene(); paint(ctx,sc.P,sc.Ball||sc.B); FR.push(performance.now()-t0); await tick()}
 out.framePaint=S(stat(FR));
 const L=LIM[dev]||{};
 const osP95=out.timerResMs>0.05?out.osnapBatch10.p95:out.osnapDefault.p95;
 out.gate={osnapLimit:L.osnap,osnapFrom:out.timerResMs>0.05?"batch10":"perQuery",
  osnapOk:L.osnap==null?null:osP95<=L.osnap,
  sceneLimit:L.scene,sceneOk:L.scene==null?null:out.sceneAfterMove.mean<=L.scene};
 LAST=out;
 $("out").textContent=JSON.stringify(out,null,1);
 $("run").disabled=false; $("copy").disabled=false;
}
$("run").addEventListener("click",()=>run().catch(e=>{$("out").textContent="خطأ: "+e.message; $("run").disabled=false}));
/* ═══ الرسّام الحقيقي ═══ نافذةُ التطبيق + bench/inapp.js */
async function runApp(){
 $("runApp").disabled=true; $("out").textContent="يفتح التطبيق في نافذةٍ جديدة…";
 const w=window.open("../index.html","cdbench");
 if(!w)throw new Error("المتصفّح منع النافذة المنبثقة — اسمح بها لهذه الصفحة");
 const wait=async(fn,ms)=>{const t=performance.now(); while(performance.now()-t<ms){try{if(fn())return true}catch(e){} await new Promise(r=>setTimeout(r,100))} return false};
 /* أوّلُ فتحٍ يثبّت عاملَ الخدمة فيُعيد التطبيقُ تحميلَ نفسه (controllerchange في app.js):
    الحقنُ يُعاد إن تبدّلت الوثيقة قبل الحقن أو أثناء القياس — حتى ثلاث محاولات */
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 let res=null;
 for(let k=0;k<3&&!res;k++){
  if(!await wait(()=>w.document&&w.document.readyState==="complete"&&w.document.getElementById("cv"),30000))
   throw new Error("لم يكتمل تحميل التطبيق خلال 30 ث");
  await sleep(2500);                              /* الإقلاع: استعادة المشروع وبناء الواجهة */
  const doc=w.document;
  if(w.document!==doc||w.document.readyState!=="complete")continue;
  const s=doc.createElement("script"); s.type="module"; s.src=new URL("./inapp.js",location.href).href;
  doc.head.appendChild(s);
  if(!await wait(()=>typeof w.__cdBench==="function"||w.document!==doc,30000))throw new Error("لم تُحمَّل inapp.js في نافذة التطبيق");
  if(w.document!==doc)continue;                   /* أُعيد التحميل: حقنٌ جديد */
  $("out").textContent="يقيس بالرسّام الحقيقي داخل التطبيق… (لا تغلق النافذة)";
  res=await Promise.race([w.__cdBench(),new Promise(r=>{const iv=setInterval(()=>{
   if(w.closed||w.document!==doc){clearInterval(iv); r(null)}},500)})]);
 }
 if(!res)throw new Error("تعذّر القياس: أُعيد تحميل التطبيق أو أُغلقت نافذته ثلاث مرات");
 const r=JSON.parse(JSON.stringify(res));
 const dev=$("dev").value, L=LIM[dev]||{};
 const out=Object.assign({device:dev,model:$("model").value||"",ua:navigator.userAgent,when:new Date().toISOString(),
  mode:"inapp"},r);
 out.gate={sceneLimit:L.scene,sceneOk:L.scene==null?null:out.frameAfterMove.mean<=L.scene};
 LAST=out; $("out").textContent=JSON.stringify(out,null,1)+"\n\nأغلق نافذة التطبيق الآن (الحفظ فيها معلَّق).";
 $("runApp").disabled=false; $("copy").disabled=false;
}
$("runApp").addEventListener("click",()=>runApp().catch(e=>{$("out").textContent="خطأ: "+e.message; $("runApp").disabled=false}));
$("copy").addEventListener("click",()=>{if(LAST&&navigator.clipboard)navigator.clipboard.writeText(JSON.stringify(LAST))});
