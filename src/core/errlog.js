/* ═══ سجلّ الأعطال المحلي ═══ المرحلة ١ من خطة التطوير (G1 · الثبات)
   حين يتعطّل البرنامج على هاتف مستخدمٍ لا نرى شيئاً: لا خادمَ يجمع، ولن
   نضيف واحداً (بلا تتبّعٍ ولا إرسال — الخصوصيةُ مبدأ). فنحفظ آخر ERRLOG_MAX
   عطباً على الجهاز نفسِه، ويُنسَخ بأمر «سجل الأعطال» فيُلصِقه المستخدمُ في
   بلاغه بإرادته.

   ورقةٌ بلا استيراد: يستورده حرسُ الإقلاع قبل كل شيء. وكلُّ لمسٍ للتخزين
   محميّ — تخزينٌ ممتلئٌ أو محجوب لا يجوز أن يصير هو نفسُه عطباً ثانياً،
   فيرجع السجلُّ إلى الذاكرة للجلسة. */
export const ERRLOG_KEY="civildraft.errlog";
export const ERRLOG_MAX=50;
const CAP=1500;                /* أقصى طولٍ لنصّ العطب الواحد */
let MEM=[];
const store=()=>{
 try{return (typeof localStorage!=="undefined"&&localStorage)||null}
 catch(e){return null}
};
export function readErrs(){
 const s=store();
 if(!s)return MEM.slice();
 try{
  const a=JSON.parse(s.getItem(ERRLOG_KEY)||"[]");
  return Array.isArray(a)?a:[];
 }catch(e){return MEM.slice()}
}
function write(a){
 MEM=a.slice(-ERRLOG_MAX);
 const s=store();
 if(!s)return;
 try{s.setItem(ERRLOG_KEY,JSON.stringify(MEM))}catch(e){}
}
const text=x=>{
 if(x==null)return "";
 if(typeof x==="string")return x;
 const st=x.stack?String(x.stack).split("\n").slice(0,6).join("\n"):"";
 const m=x.message!=null?String(x.message):String(x);
 return st&&st.indexOf(m)>=0?st:(m+(st?"\n"+st:""));
};
/* يسجّل عطباً. التكرارُ المتتالي نفسُه (حلقةُ رسمٍ ترمي كل إطار) يُعَدّ ولا
   يُكرَّر — وإلا محا عطبٌ واحدٌ السجلَّ كلَّه في ثانية. */
export function logErr(where,err){
 try{
  const m=text(err).slice(0,CAP)||"عطبٌ غير موصوف";
  const w=String(where||"").slice(0,40);
  const a=readErrs();
  const last=a[a.length-1];
  if(last&&last.m===m&&last.w===w){
   last.n=(last.n||1)+1; last.t=new Date().toISOString();
  }else a.push({t:new Date().toISOString(),w,m});
  write(a);
  return a[a.length-1];
 }catch(e){return null}
}
export function clearErrs(){
 MEM=[];
 const s=store();
 if(s)try{s.removeItem(ERRLOG_KEY)}catch(e){}
}
/* نصُّ البلاغ: الإصدار والمتصفّح ثم الأعطال، الأحدثُ أوّلاً. لا شيء من
   المشروع نفسِه — لا أسماءَ ولا أرقام — فيُلصَق في أي مكانٍ آمناً. */
export function errReport(meta){
 const M=meta||{};
 const a=readErrs().slice().reverse();
 const head=[`CivilDraft ${M.version||"?"} · سجلّ الأعطال (${a.length})`,
  `المتصفّح: ${M.ua||(typeof navigator!=="undefined"&&navigator.userAgent)||"?"}`,
  `وقت النسخ: ${new Date().toISOString()}`,""];
 return head.concat(a.map(e=>
  `[${e.t}] ${e.w?`(${e.w}) `:""}${e.n>1?`×${e.n} `:""}${e.m}`)).join("\n");
}
