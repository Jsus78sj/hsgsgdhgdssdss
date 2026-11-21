/* ═══ الحسابُ الثقيل في الخلفية ═══ المرحلة ١ من خطة التطوير (G1 · الثبات والسلاسة)
   قِيسَ الفاحصُ على ١٠ آلاف جدار: ~٩٠٠ م.ث على الحاسوب — وعلى هاتفٍ متوسّطٍ
   أضعافُ ذلك، والواجهةُ متجمّدةٌ طوالها. فهنا يُرسَل المشروعُ (pack) إلى عاملٍ
   في الخلفية يحسب inspect على نسخته ويعيد النتيجة، والواجهةُ حرّة.

   القواعد:
   • المشروعُ الصغير (< BIG عنصر) يبقى متزامناً كما كان — كلفةُ النقل أكبر
     من الحساب، وكلُّ الاختبارات القديمة تبقى على مسارها.
   • أيُّ عطبٍ في العامل (لا Worker · رفضُ CSP · مهلة · رمي) ⇒ الحسابُ محلّياً.
     لا يضيع فحصٌ أبداً؛ أسوأ الحالات هي السلوكُ القديم.
   • المرجعُ المرفوع (ref.js) ليس في pack ⇒ المشروعُ ذو المرجع يُفحَص محلّياً.
   • ورقةٌ نقيّة: لا DOM إلا عند إنشاء العامل، فتُستورَد في node بلا شيء. */
import {S,pack} from "./state.js";
import {CODE} from "./code.js";
import {inspect} from "./inspect.js";
import {hasRef} from "./ref.js";

export const BIG=3000;          /* عتبةُ النقل إلى الخلفية (عدد العناصر) */
export const TIMEOUT_MS=30000;  /* بعدها يُفحَص محلّياً */

/* عددُ العناصر: مجموعُ أطوال المصفوفات العليا في الحالة — تقديرٌ رخيصٌ
   يكفي لقرار «صغير أم كبير»، لا عدٌّ دقيقٌ لكل نوع. */
export const entCount=()=>Object.keys(S).reduce((n,k)=>
 n+(Array.isArray(S[k])?S[k].length:0),0);

let W=null, SEQ=0, DEAD=false;
const PEND=new Map();
const failAll=msg=>{
 PEND.forEach(p=>{clearTimeout(p.t); p.rej(new Error(msg))});
 PEND.clear();
};
/* عنوانُ العامل نسبيٌّ إلى الصفحة لا إلى هذا الملف: في dist المجمَّع يصير
   هذا الملفُّ جزءاً من حزمةٍ أخرى فيكذب import.meta.url، والصفحةُ ثابتة. */
export const WORKER_PATH="src/workers/compute.js";
function worker(){
 if(W)return W;
 W=new Worker(new URL(WORKER_PATH,document.baseURI),{type:"module"});
 W.onmessage=e=>{
  const m=e.data||{}, p=PEND.get(m.id);
  if(!p)return;
  PEND.delete(m.id); clearTimeout(p.t);
  if(m.ok)p.res(m.r); else p.rej(new Error(m.err||"عطبٌ في العامل"));
 };
 W.onerror=e=>{
  /* عاملٌ لا يُحمَّل (CSP · ملفٌّ مفقود · متصفّحٌ بلا module worker):
     نعطّله للجلسة كلّها فلا نحاول في كل فحص. */
  DEAD=true;
  try{e.preventDefault()}catch(x){}
  try{W.terminate()}catch(x){}
  W=null;
  failAll("تعذّر تشغيل العامل");
 };
 return W;
}
export function workerOk(){
 return !DEAD&&typeof Worker==="function"&&typeof document!=="undefined";
}
/* هل يذهب هذا الفحص إلى الخلفية؟ */
export function wantOffload(){
 return workerOk()&&entCount()>=BIG&&!hasRef();
}
function post(op,payload){
 return new Promise((res,rej)=>{
  const id=++SEQ;
  const t=setTimeout(()=>{PEND.delete(id); rej(new Error("مهلة العامل"))},
   TIMEOUT_MS);
  PEND.set(id,{res,rej,t});
  try{worker().postMessage(Object.assign({id,op},payload))}
  catch(x){PEND.delete(id); clearTimeout(t); DEAD=true; rej(x)}
 });
}
/* الرسالةُ التي يفهمها العامل — مُصدَّرةٌ ليبنيها الاختبار نفسَها */
export const inspectMsg=(bbox,opt)=>({op:"inspect",proj:pack(),
 code:Object.assign({},CODE),bbox:bbox||null,opt:opt||null});

/* inspect غير متزامن: في الخلفية إن كان المشروعُ كبيراً، وإلا محلّياً.
   يَعِد دائماً بنتيجةٍ بشكل inspect نفسِه {list,er,wr,in}. */
export function inspectAsync(bbox,opt){
 const local=()=>inspect(bbox,opt);
 if(!wantOffload())return Promise.resolve().then(local);
 return post("inspect",inspectMsg(bbox,opt)).catch(local);
}
/* للاختبار والتشخيص */
export const offloadState=()=>({dead:DEAD,live:!!W,pending:PEND.size});
