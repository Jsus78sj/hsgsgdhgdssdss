/* ═══ عاملُ الحساب ═══ المرحلة ١ من خطة التطوير (G1)
   يعمل خارج خيط الواجهة: يستقبل نسخةً من المشروع (pack) فيحمّلها في
   حالته الخاصّة ويحسب عليها. لا DOM ولا localStorage هنا — والحفظُ
   التلقائيّ معلَّقٌ (saveHold) فلا يكتب العاملُ شيئاً أبداً.

   handle() مُصدَّرةٌ نقيّةً ليختبرها node في خيطٍ منفصل
   (src/tests/offload.test.js)، والربطُ بـ self لا يقع إلا داخل عامل. */
import {loadState,saveHold} from "../core/state.js";
import {CODE} from "../core/code.js";
import {inspect} from "../core/inspect.js";

saveHold(true);

export function handle(m){
 if(!m||m.op!=="inspect")throw new Error(`عمليةٌ مجهولة: ${m&&m.op}`);
 loadState(m.proj,true);
 if(m.code)Object.assign(CODE,m.code);
 const r=inspect(m.bbox||undefined,m.opt||undefined);
 return {list:r.list,er:r.er,wr:r.wr,in:r.in};
}

const inWorker=typeof WorkerGlobalScope!=="undefined"
 &&typeof self!=="undefined"&&self instanceof WorkerGlobalScope;
if(inWorker){
 self.onmessage=e=>{
  const m=e.data||{};
  try{self.postMessage({id:m.id,ok:1,r:handle(m)})}
  catch(x){self.postMessage({id:m.id,ok:0,err:String(x&&x.message||x)})}
 };
}
