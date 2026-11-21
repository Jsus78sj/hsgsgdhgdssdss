/* ═══ المرحلة ١ من خطة التطوير — الثبات والسلاسة (G1) ═══
   يثبت:
   ١. عاملُ الفحص (workers/compute.js) يعطي نتيجةَ الفحص المحلي نفسَها حرفاً،
      ويعمل في خيطٍ منفصلٍ بلا DOM ولا localStorage.
   ٢. offload: المشروعُ الصغير وبيئةٌ بلا Worker ⇒ الفحصُ محلّيٌّ بلا تغيير.
   ٣. سجلُّ الأعطال المحلي: دوّار، يدمج المتكرّر، لا ينهار بلا تخزين.
   ٤. الكُتّابُ كسولون: الإقلاعُ لا يحمّل pdf/svg/dxf/png/zip وما يتبعها،
      والتصديرُ ما زال يعمل بعد التحميل.
   ٥. التراجعُ لا يقلب أنماطَ الالتقاط (S.os) ولا زوايا التتبّع (S.pol).
   التشغيل: node src/tests/phase1-stability.test.js */
import {shim,shimCanvas,group,groupAsync,eq,ok,deep,summary} from "./harness.js";
import {readFileSync} from "node:fs";
import {Worker} from "node:worker_threads";
import {dirname,join} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
const ROOT=join(dirname(fileURLToPath(import.meta.url)),"..","..");
const rd=p=>readFileSync(join(ROOT,p),"utf8");

/* ── ١: العامل في خيطٍ منفصل — قبل shim عمداً: لا DOM هناك ولا هنا ── */
const COMPUTE=pathToFileURL(join(ROOT,"src/workers/compute.js")).href;
const inThread=msg=>new Promise((res,rej)=>{
 const w=new Worker(`
  const {parentPort,workerData}=require("node:worker_threads");
  import(workerData.url).then(M=>{
   parentPort.postMessage({ok:1,r:M.handle(workerData.msg),
    dom:typeof document, ls:typeof localStorage});
  }).catch(e=>parentPort.postMessage({ok:0,err:String(e&&e.stack||e)}));
 `,{eval:true,workerData:{url:COMPUTE,msg}});
 w.once("message",m=>{w.terminate(); m.ok?res(m):rej(new Error(m.err))});
 w.once("error",rej);
});

shim(); shimCanvas();
const ST=await import("../core/state.js");
const {S,newState,ensureShape,touchGeom,edit,undo,redo}=ST;
const W=await import("../core/walls.js");
const O=await import("../core/opens.js");
const {inspect}=await import("../core/inspect.js");
const {CODE}=await import("../core/code.js");
const OF=await import("../core/offload.js");

/* مشروعٌ فيه ما يُبلَّغ عنه: أطرافٌ سائبة وجدرانٌ مكرَّرة */
function build(n){
 newState(); ensureShape();
 const k=Math.ceil(Math.sqrt(n));
 for(let i=0;i<n;i++){
  const x=(i%k)*5000, y=Math.floor(i/k)*5000;
  const a=W.addWall([x,y],[x+4000,y],200,"int","c");
  W.addWall([x+4000,y],[x+4000,y+4000],200,"int","c");
  if(i%3)W.addWall([x+4000,y+4000],[x,y+4000],200,"int","c");  /* غرفٌ مفتوحة */
  O.addOpen(a,2000,"door",900,2100,0);
  if(i%7===0)W.addWall([x,y],[x+4000,y],200,"int","c");          /* جدارٌ مكرَّر */
 }
 touchGeom();
}

await groupAsync("العامل = الفحص المحلي حرفاً، في خيطٍ بلا DOM",async()=>{
 build(60);
 CODE.on=1;
 const local=inspect();
 ok(local.list.length>20,`في المشروع ما يُبلَّغ عنه (${local.list.length})`);
 const m=await inThread(OF.inspectMsg());
 eq(m.dom,"undefined","لا document في خيط العامل");
 eq(m.ls,"undefined","ولا localStorage");
 eq(JSON.stringify(m.r.list),JSON.stringify(local.list),"القائمةُ نفسُها بالترتيب");
 deep([m.r.er,m.r.wr,m.r.in],[local.er,local.wr,local.in],"والعدّادات نفسُها");
 CODE.on=0;
 const off=inspect();
 const m2=await inThread(OF.inspectMsg());
 eq(m2.r.list.length,off.list.length,"وقيمُ الاشتراطات تُنقَل (CODE.on=0)");
});
await groupAsync("العامل يرمي على عمليةٍ مجهولة بدل نتيجةٍ مضلِّلة",async()=>{
 let err="";
 try{await inThread({op:"nope"})}catch(e){err=e.message}
 ok(/عمليةٌ مجهولة/.test(err),"رسالةٌ واضحة");
});

/* ── ٢: offload ── */
await groupAsync("offload: بلا Worker أو مشروعٌ صغير ⇒ محلّيٌّ كما كان",async()=>{
 build(20);
 ok(OF.entCount()>0&&OF.entCount()<OF.BIG,`مشروعٌ صغير (${OF.entCount()} < ${OF.BIG})`);
 eq(OF.wantOffload(),false,"لا نقل");
 const a=inspect(), b=await OF.inspectAsync();
 eq(JSON.stringify(b),JSON.stringify(a),"inspectAsync = inspect");
 eq(OF.workerOk(),false,"وnode بلا Worker ⇒ لا عامل");
 deep(OF.offloadState(),{dead:false,live:false,pending:0},"ولا عاملَ أُنشئ");
});
group("العاملُ يُحمَّل بعنوانٍ نسبيٍّ للصفحة، والفاحصُ يمرّ عبره",()=>{
 eq(OF.WORKER_PATH,"src/workers/compute.js","المسار");
 const ins=rd("src/ui/inspector.js");
 ok(/inspectAsync/.test(ins)&&/wantOffload\(\)/.test(ins),"inspector يستعمل offload");
 ok(/my!==ISEQ/.test(ins),"ونتيجةٌ قديمةٌ لا تكتب فوق أحدث");
 ok(/type:"module"/.test(rd("src/core/offload.js")),"عاملُ وحدات (module worker)");
});

/* ── ٣: سجلّ الأعطال ── */
const EL=await import("../core/errlog.js");
group("سجلّ الأعطال: يحفظ ويدمج المتكرّر ويدور عند الحدّ",()=>{
 EL.clearErrs();
 eq(EL.readErrs().length,0,"يبدأ فارغاً");
 /* الموضعُ نفسُه ثلاثاً (كحلقة رسمٍ ترمي كل إطار) */
 for(let i=0;i<3;i++)EL.logErr("تشغيل",new Error("انفجر شيء"));
 const a=EL.readErrs();
 eq(a.length,1,"ثلاثةُ أعطالٍ متطابقة = سطرٌ واحد");
 eq(a[0].n,3,"بعدّاد ×3");
 for(let i=0;i<EL.ERRLOG_MAX+15;i++)EL.logErr("ح",`عطب ${i}`);
 const b=EL.readErrs();
 eq(b.length,EL.ERRLOG_MAX,`لا يتجاوز ${EL.ERRLOG_MAX}`);
 eq(b[b.length-1].m,`عطب ${EL.ERRLOG_MAX+14}`,"والأحدثُ آخراً");
 const t=EL.errReport({version:"9.9.9",ua:"TestUA"});
 ok(/CivilDraft 9\.9\.9/.test(t)&&/TestUA/.test(t),"البلاغ يحمل الإصدارَ والمتصفّح");
 ok(t.indexOf(`عطب ${EL.ERRLOG_MAX+14}`)<t.indexOf(`عطب ${EL.ERRLOG_MAX+13}`),
  "الأحدثُ أوّلاً في البلاغ");
 EL.logErr("ح",{message:"x".repeat(5000)});
 ok(EL.readErrs().pop().m.length<=1500,"النصُّ الطويل يُقصّ");
 EL.clearErrs(); eq(EL.readErrs().length,0,"ويُمسح");
});
group("سجلّ الأعطال لا ينهار حين يرفض التخزينُ الكتابة",()=>{
 const LS=globalThis.localStorage;
 const set=LS.setItem;
 LS.setItem=()=>{throw new Error("QuotaExceededError")};
 let r=null;
 try{r=EL.logErr("ح","تخزينٌ ممتلئ")}finally{LS.setItem=set}
 ok(r&&r.m==="تخزينٌ ممتلئ","يعيد السجلّ بلا رمي");
 EL.clearErrs();
});
group("حرسُ الإقلاع يسجّل، وأمرا «سجلّ الأعطال» موجودان",()=>{
 const bg=rd("src/bootguard.js");
 ok(!/^import /m.test(bg),"الحارسُ ما زال ورقةً بلا استيراد");
 ok(bg.indexOf(`"${EL.ERRLOG_KEY}"`)>=0&&/ERRLOG_MAX=50/.test(bg),
  "وكاتبُه المصغَّر بمفتاح errlog وحدِّه نفسَيهما");
 ok((bg.match(/logErr\(/g)||[]).length>=3,"ويسجّل في error وunhandledrejection");
 ok(!/^import /m.test(rd("src/core/errlog.js")),"errlog ورقةٌ بلا استيراد");
 const ac=rd("src/ui/appcmds.js");
 ok(/act\("errlog",\s*"errLog"/.test(ac)&&/act\("errclear","errClear"/.test(ac),"الأمران معرَّفان");
 const as=rd("src/ui/actions.js");
 ok(/errLog:\s*\{id:"errLog"/.test(as)&&/errReport\(\{version:VERSION\}\)/.test(as),
  "وفعلاهما في actions.js يحملان الإصدار");
 ok(/act:"errLog"/.test(rd("src/ui/appmenu.js")),"وبيتُهما قائمةُ التطبيق");
});

/* ── ٤: الكُتّاب الكسولون ── */
const SB=await import("../../scripts/size-budget.js");
group("الإقلاعُ لا يحمّل كُتّابَ الملفّات",()=>{
 const r=SB.measure(ROOT);
 const f=new Set(r.files.map(x=>x.f.replace(/\\/g,"/")));
 ["src/io/pdf.js","src/io/svg.js","src/io/dxf.js","src/io/png.js","src/io/zip.js",
  "src/io/sect.js","src/io/elev.js","src/io/boqpdf.js","src/io/report.js"]
  .forEach(m=>ok(!f.has(m),`${m} ليس في رسم الإقلاع`));
 ok(f.has("src/io/export.js"),"وexport.js (التخطيطُ والفحص المسبق) باقٍ متزامناً");
 eq(r.missing.length,0,"ولا استيرادَ مفقود");
});
group("size-budget: محلّلُ الاستيراد يتجاهل الديناميكيَّ والتعليق",()=>{
 /* المسارُ يُبنى بدالّةٍ كي لا يحسبه حارسُ «كل استيرادٍ موجود» استيراداً حقيقياً */
 const q=n=>JSON.stringify("./"+n+".js"), F=" fr"+"om ";
 deep(SB.staticImports(`import {a}${F}${q("a")};\nexport {b}${F}${q("b")};\n`
  +`import ${q("c")};\n/* import x${F}${q("no")} */\nconst m=import(${q("lazy")});`),
  ["./a.js","./b.js","./c.js"],"ساكنٌ فقط");
 deep(SB.staticImports(`import{a as b}${F.trim()}${q("m")};export*${F.trim()}${q("n")}`),
  ["./m.js","./n.js"],"والمصغَّر بلا مسافات");
 ok(SB.BUDGET.src>0&&SB.BUDGET.dist>0,"وحدودُ الميزانية معرَّفة");
});
const EX=await import("../io/export.js");
await groupAsync("التصدير يعمل بعد التحميل الكسول",async()=>{
 build(4);
 await EX.writersReady();
 const r=await EX.run("svg",{});
 ok(r.ok,"SVG جاهز");
 ok(r.raw&&String(r.raw).indexOf("<svg")>=0,"ونصُّه SVG فعلاً");
 const d=await EX.run("dxf",{});
 ok(d.ok&&d.raw&&d.raw.length>100,"وDXF");
 ok(EX.writersReady()===EX.writersReady(),"والتحميلُ مرّةً واحدة (الوعدُ نفسُه)");
});

/* ── ٥: التراجع ونمطُ الالتقاط ── */
group("التراجعُ لا يقلب أنماطَ الالتقاط ولا زوايا التتبّع",()=>{
 newState(); ensureShape();
 edit(()=>W.addWall([0,0],[4000,0],200,"int","c"),"جدار");
 S.os.mid=0; S.os.near=1; S.pol.inc=30;
 undo();
 eq(S.walls.length,0,"التراجعُ أزال الجدار");
 eq(S.os.mid,0,"و«منتصف» بقي مطفأً");
 eq(S.os.near,1,"و«الأقرب» بقي مشغَّلاً");
 eq(S.pol.inc,30,"وزاوية التتبّع كما ضُبطت");
 redo();
 eq(S.walls.length,1,"والإعادةُ أعادته");
 eq(S.os.mid,0,"ولم تقلب الالتقاط");
 newState();
 eq(S.os.mid,1,"ومشروعٌ جديد (full) يعيد الافتراضيّ");
});

process.exit(summary()?1:0);
