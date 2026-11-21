/* ═══ أداء الالتقاط والإصابة على ١٠ آلاف عنصر ═══ (م٠ · §١-٢ب · البوابة ب٠-٢)
   المولّد (bench/gen10k.js، مشتركٌ مع صفحة القياس): 5100 جدار قصير + 2601 عمود (شبكة 51×51) + 2299 بُعداً = 10000،
   و3000 نقطة استعلام بذرتُها ثابتة.

   يُفشِل: p95 لـosnap بالأنماط الافتراضية > 0.2 م.ث (هامش ×5 فوق المقيس
   ≈0.02–0.04) مضروباً بمعامل الآلة من core/perf.js، فالآلةُ البطيئة لا تُفشله
   ظلماً والسريعةُ لا تُرخيه.
   ويسجّل ولا يُفشِل (أرقامٌ لبوابة ب٠-٢ — الحدُّ على سطح المكتب في المتصفح
   لا في Node): hitTest، وإعادةُ بناء الفهرس المكاني، وإعادةُ بناء المشهد بعد
   تحريك جدارٍ واحد (P4-006). ويكتب الأرقام إلى stdout بسطر «ب٠-٢:».
   ويقيس كلفةَ قائمة المرشّحين osnapAll (الملحق ١٤-٦، تدوير Tab في م٢أ)،
   ومعيارَ م٢أ: p95 ≤ 0.1 م.ث × معامل الآلة.
   التشغيل: node src/tests/perf-osnap-10k.test.js                     */
import {shim,group,ok,eq,summary} from "./harness.js";
shim();
const ST=await import("../core/state.js");
const RN=await import("../core/render.js");
const PF=await import("../core/perf.js");
const OS=await import("../core/osnap.js");
const EN=await import("../core/ents.js");
const SI=await import("../core/sindex.js");
const {build10k,stat,rnd}=await import("../../bench/gen10k.js");
const {readFileSync,writeFileSync,mkdtempSync,rmSync}=await import("node:fs");
const {tmpdir}=await import("node:os");
const {join}=await import("node:path");
const {fileURLToPath,pathToFileURL}=await import("node:url");

export const P95_LIMIT=0.2;     /* م.ث، قبل معامل الآلة */
const warn=console.warn; console.warn=()=>{};

const time=(Q,fn)=>{ for(let i=0;i<200;i++)fn(Q[i]);      /* تسخين */
 const T=[]; for(const q of Q){const t0=performance.now(); fn(q); T.push(performance.now()-t0)}
 return stat(T)};
const f=v=>+v.toFixed(4);

const G=build10k();
const K=PF.machineFactor();
const OUT={n:G.n, factor:+K.toFixed(2)};

group("المولّد",()=>{
 eq(G.n,10000,"عشرةُ آلاف عنصر");
 eq(G.Q.length,3000,"و3000 نقطة استعلام");
});

group("osnap: الحارس p95",()=>{
 SI.grid();
 const def=time(G.Q,q=>OS.osnap(q[0],q[1],320));
 const wide=time(G.Q,q=>OS.osnap(q[0],q[1],560));
 const keep=Object.assign({},ST.S.os);
 Object.keys(ST.S.os).forEach(k=>ST.S.os[k]=1);
 const all=time(G.Q,q=>OS.osnap(q[0],q[1],320,[q[0]-1500,q[1]-900]));
 ST.S.os=keep;
 OUT.osnapDefault=def; OUT.osnapWide=wide; OUT.osnapAll=all;
 ok(def.p95<=P95_LIMIT*K,`الافتراضيّ 320 مم: p95 ${f(def.p95)} م.ث ≤ ${f(P95_LIMIT*K)}`);
 ok(def.p95<=0.1*K,`معيار م٢أ: الافتراضيّ p95 ${f(def.p95)} م.ث ≤ ${f(0.1*K)}`);
 ok(wide.p95<=P95_LIMIT*K,`تفاوت 560 مم: p95 ${f(wide.p95)} م.ث`);
 ok(all.p95<=P95_LIMIT*K*2,`كل الأنماط مع نقطة أساس: p95 ${f(all.p95)} م.ث ≤ ضعف الحدّ`);
 const hit=time(G.Q,q=>EN.hitTest(q[0],q[1],280));
 OUT.hitTest=hit;
 ok(hit.p95<=P95_LIMIT*K*2,`hitTest 280 مم: p95 ${f(hit.p95)} م.ث`);
});

/* ═══ الملحق ١٤-٦ · كلفة قائمة المرشّحين (م٢أ) ═══
   في م٠ قيست بنسخةٍ مؤقّتة محوَّلة من osnap.js؛ بعد م٢أ صارت osnapAll
   (واحدٌ لكل نمط، بلا نقطةٍ مكرّرة) هي المصدر، وosnap = أوّلها. القياس الآن
   على الدالّة الحقيقية: الكلفة فوق osnap، وعدد المرشّحين قرب الأطراف. */
group("الملحق ١٤-٦: قائمة المرشّحين الحقيقية (osnapAll · م٢أ)",()=>{
 ok(typeof OS.osnapAll==="function","osnapAll مُصدَّرة");
 const r=rnd(146), W=ST.S.walls;
 const QD=[]; for(let i=0;i<3000;i++){const w=W[Math.floor(r()*W.length)], e=r()<0.5?w.a:w.b;
  QD.push([e[0]+(r()-0.5)*300,e[1]+(r()-0.5)*300])}
 const same=QD.slice(0,500).every(q=>{const a=OS.osnap(q[0],q[1],320), L=OS.osnapAll(q[0],q[1],320);
  return (!a&&!L.length)||(a&&L[0]&&L[0].m===a.m&&L[0].p+""===a.p+"")});
 ok(same,"osnap = أوّل osnapAll في كل استعلام");
 const best=time(QD,q=>OS.osnap(q[0],q[1],320));
 const all=time(QD,q=>OS.osnapAll(q[0],q[1],320));
 const nC=stat(QD.map(q=>OS.osnapAll(q[0],q[1],320).length));
 OUT.cycleDenseBest=best; OUT.cycleDenseAll=all; OUT.cycleCount=nC;
 ok(best.p95<=0.1*K,`كثيف قرب الأطراف: osnap p95 ${f(best.p95)} م.ث ≤ ${f(0.1*K)} (معيار م٢أ)`);
 ok(isFinite(all.p95),`osnapAll p95 ${f(all.p95)} م.ث`);
 ok(nC.max<=10,`عدد المرشّحين في النقطة: متوسط ${nC.mean.toFixed(1)} · p95 ${nC.p95} · أقصى ${nC.max} (≤ عدد الأنماط)`);
});

group("إعادة البناء بعد تعديل (تسجيلٌ لبوابة ب٠-٢)",()=>{
 const T=[];
 for(let i=0;i<5;i++){ST.touchGeom(); const t0=performance.now(); SI.grid(); T.push(performance.now()-t0)}
 OUT.sindexRebuild=stat(T);
 ok(OUT.sindexRebuild.mean>0,`الفهرس المكاني: متوسط ${OUT.sindexRebuild.mean.toFixed(1)} م.ث`);
 RN.scene();
 const S=[];
 for(let i=0;i<3;i++){
  const w=ST.S.walls[100+i];
  w.b=[w.b[0]+100,w.b[1]];
  ST.touchGeom(); RN.invalidate();
  const t0=performance.now(); RN.scene(); S.push(performance.now()-t0);
 }
 OUT.sceneAfterMove=stat(S);
 const gate=OUT.sceneAfterMove.mean<=250;
 ok(isFinite(OUT.sceneAfterMove.mean),
  `المشهد بعد تحريك جدار: ${OUT.sceneAfterMove.mean.toFixed(0)} م.ث `
  +`(معيار ب٠-٢ ≤ 250 على سطح المكتب: ${gate?"يتحقق في Node":"لا يتحقق في Node"})`);
 /* حارسُ P4-006 القائم هو الذي يُفشِل المشهد (perf.budget.test.js)؛ هنا رقمٌ للبوابة */
 const b=PF.withinSceneBudget(G.n,OUT.sceneAfterMove.mean);
 ok(b.ok,`وداخل ميزانية P4-006 (${b.limit.toFixed(0)} م.ث)`);
});

/* ═══ م٢ب · المصادر الجديدة والتتبّع ═══ معيار القبول: osnap p95 ≤ 0.1 م.ث × المعامل
   بعد إضافة المصادر (خطوط متعدّدة وعناصر إنشائية)، وبناء الفهرس لا يزيد أكثر من 15%
   عن 41 م.ث (المقيس في الخطة) × المعامل، والتتبّع من ٥ نقاط لا يمسّ الفهرس. */
const PLm=await import("../core/plines.js");
const STRm=await import("../core/struct.js");
const OTm=await import("../core/otrack.js");
group("م٢ب: المصادر الجديدة (خطوط متعدّدة وعناصر إنشائية) والتتبّع",()=>{
 const r2=rnd(2026), SP=4000, N=51;
 for(let i=0;i<600;i++){const x=(i%N)*SP+700, y=Math.floor(i/N)*SP+1200;
  PLm.addPline([[x,y],[x+1500,y],[x+1500,y+900]])}
 for(let i=0;i<200;i++){const x=(i%N)*SP+300, y=Math.floor(i/N)*SP+3300;
  STRm.addBeam([x,y],[x+2500,y],300,600,"conc")}
 for(let i=0;i<200;i++){const x=(i%N)*SP+3000, y=Math.floor(i/N)*SP+2600;
  STRm.addFooting([x,y],1200,1200,0,500,"conc")}
 ST.touchGeom(); RN.invalidate();
 const T=[];
 for(let i=0;i<5;i++){ST.touchGeom(); const t0=performance.now(); SI.grid(); T.push(performance.now()-t0)}
 OUT.m2bSindex=stat(T);
 ok(OUT.m2bSindex.mean<=41*1.15*K,`الفهرس مع 11000 كيان: ${OUT.m2bSindex.mean.toFixed(1)} م.ث ≤ ${(41*1.15*K).toFixed(1)}`);
 const def=time(G.Q,q=>OS.osnap(q[0],q[1],320));
 OUT.m2bOsnap=def;
 ok(def.p95<=0.1*K,`osnap مع المصادر الجديدة: p95 ${f(def.p95)} م.ث ≤ ${f(0.1*K)}`);
 const PLs=ST.S.plines, QP=[];
 for(let i=0;i<3000;i++){const l=PLs[Math.floor(r2()*PLs.length)], v=l.pts[Math.floor(r2()*3)];
  QP.push([v[0]+(r2()-0.5)*300,v[1]+(r2()-0.5)*300])}
 const dense=time(QP,q=>OS.osnap(q[0],q[1],320));
 OUT.m2bDense=dense;
 ok(dense.p95<=0.1*K,`كثيف قرب رؤوس الخطوط المتعدّدة: p95 ${f(dense.p95)} م.ث ≤ ${f(0.1*K)}`);
 OTm.clear(); for(let i=0;i<5;i++)OTm.acquire({p:[i*SP+500,i*SP+300],m:"end"});
 eq(OTm.ACQ.length,5,"خمس نقاط مكتسبة");
 const tr=time(G.Q,q=>OTm.trackSnap(q[0],q[1],320,{mode:"polar",inc:15,extra:[]}));
 OUT.m2bTrack=tr;
 ok(tr.p95<=0.1*K,`trackSnap (5 نقاط × قطبي 15°): p95 ${f(tr.p95)} م.ث ≤ ${f(0.1*K)}`);
 OTm.clear();
});

console.warn=warn;
const r=o=>o&&o.mean!=null?{mean:f(o.mean),p95:f(o.p95),max:f(o.max)}:o;
console.log("\nب٠-٢:",JSON.stringify(Object.fromEntries(Object.entries(OUT).map(([k,v])=>[k,r(v)]))));
process.exit(summary()?1:0);
