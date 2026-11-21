/* ═══ المشاريعُ الأخيرة ═══ المرحلة ٢ من خطّة التطوير (v2.6.0)
   «مركز المشروع: شاشةُ بدايةٍ تعرض المشاريعَ الأخيرة والقوالب».
   المتصفّحُ لا يعيد فتحَ ملفٍّ بمساره، فالقائمةُ لا تحفظ مساراً: كلُّ
   حفظٍ أو فتحٍ لملفّ مشروعٍ يُبقي **نسخةً كاملة** (pack) في مخزن اللقطات
   نفسِه (IndexedDB) تحت معرّفٍ مشتقٍّ من الاسم، فالمشروعُ نفسُه يُحفَظ
   مرّةً واحدةً مهما تكرّر حفظُه، والأحدثُ يعلو.

   الفهرسُ خفيفٌ في localStorage (civildraft.recent) كفهرس اللقطات،
   والفتحُ يمرّ بـ edit() فيصير خطوةَ تراجعٍ واحدة كاستعادة اللقطة.
   ولا شيءَ يُكتَب إن لم يُتَح IndexedDB: فهرسٌ يَعِد بما لا يُفتَح كذبٌ.

   المنطقُ الخالصُ (recentKey · recentNote · recentClean) بلا تخزينٍ،
   والمخزنُ قابلٌ للحقن (setRecentStore) فيُختبَر كلُّه في node. */
import {S,pack,loadState,edit,editFailed} from "../core/state.js";
import {snapPut,snapGet,snapDel} from "./store.js";

export const RECENT_K="civildraft.recent";
export const RECENT_MAX=8;

/* المخزن: افتراضُه IndexedDB عبر دوالّ اللقطات، والاختبارُ يحقن بديلاً */
let STORE={put:snapPut,get:snapGet,del:snapDel};
export function setRecentStore(s){
 STORE=(s&&typeof s.put==="function"&&typeof s.get==="function")
  ?{put:s.put,get:s.get,del:typeof s.del==="function"?s.del:async()=>{}}
  :{put:snapPut,get:snapGet,del:snapDel};
}

const clip=(v,n)=>String(v==null?"":v).replace(/[\u0000-\u001f]/g," ").trim().slice(0,n);

/* المعرّفُ من الاسم: الاسمُ نفسُه (بلا امتداد ولا فراغاتٍ ولا حالةِ أحرف)
   ⇒ المعرّفُ نفسُه، فحفظُ «فيلا.json» ثم «فيلا» مدخلٌ واحد. djb2 بـ32 بتّاً. */
export function recentKey(name){
 const s=clip(name,120).replace(/\.(json|cdp|civildraft)$/i,"")
  .toLowerCase().replace(/\s+/g," ");
 let h=5381;
 for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;
 return "r_"+h.toString(36)+"_"+s.length.toString(36);
}

/* سطرٌ واحدٌ صالحٌ أو null — الفهرسُ يُقرأ من تخزينٍ قد يُعبَث به */
function rowOf(e){
 if(!e||typeof e!=="object")return null;
 const id=clip(e.id,40);
 if(!/^r_[a-z0-9]+_[a-z0-9]+$/.test(id))return null;
 const t=+e.t;
 return {id,n:clip(e.n,80)||"بلا اسم",t:isFinite(t)&&t>0?Math.round(t):0,
  src:e.src==="open"?"open":"save",
  w:Math.max(0,+e.w|0),o:Math.max(0,+e.o|0),a:Math.max(0,+e.a|0)};
}
/* تطبيعُ قائمةٍ كاملة: صالحةٌ · بلا تكرار · الأحدثُ أوّلاً · بالسقف */
export function recentClean(list){
 const seen=new Set(), out=[];
 (Array.isArray(list)?list:[]).map(rowOf).filter(Boolean)
  .sort((a,b)=>b.t-a.t)
  .forEach(r=>{if(!seen.has(r.id)){seen.add(r.id); out.push(r)}});
 return out.slice(0,RECENT_MAX);
}
/* خالصة: تُدخل مدخلاً في رأس القائمة وتُعيد {list, dropped} — والمُسقَطُ
   معرّفاتٌ يحذف المُنادي أجسامَها من المخزن. */
export function recentNote(list,entry){
 const e=rowOf(entry);
 const L=recentClean(list);
 if(!e)return {list:L,dropped:[]};
 const rest=L.filter(x=>x.id!==e.id);
 const all=[e].concat(rest);
 return {list:all.slice(0,RECENT_MAX),dropped:all.slice(RECENT_MAX).map(x=>x.id)};
}

/* ═══ الفهرس ═══ */
export function recentList(){
 if(typeof localStorage==="undefined")return [];
 try{return recentClean(JSON.parse(localStorage.getItem(RECENT_K)||"[]"))}
 catch(e){return []}
}
function writeList(L){
 try{localStorage.setItem(RECENT_K,JSON.stringify(L)); return true}
 catch(e){return false}
}

/* يُسجَّل بعد حفظٍ أو فتحٍ ناجح. المشروعُ الفارغُ لا يُسجَّل.
   لا يرمي: الفشلُ نتيجةٌ تُقرأ، لا استثناءٌ يقطع مسارَ الحفظ. */
export async function recentRecord(src,name){
 if(!S.walls.length&&!S.areas.length&&!(S.cols||[]).length)return {ok:0,err:"فارغ"};
 const n=clip(name,80)||clip(S.meta&&S.meta.name,80)||"بلا اسم";
 const id=recentKey(n);
 let r=null;
 try{r=await STORE.put(id,pack())}catch(e){return {ok:0,err:(e&&e.message)||"خطأ"}}
 if(!r||!r.ok)return {ok:0,err:"IndexedDB غير متاح"};
 const {list,dropped}=recentNote(recentList(),{id,n:n.replace(/\.(json|cdp|civildraft)$/i,""),
  t:Date.now(),src:src==="open"?"open":"save",
  w:S.walls.length,o:S.opens.length,a:S.areas.length});
 for(const d of dropped){try{await STORE.del(d)}catch(e){}}
 if(!writeList(list))return {ok:0,id,err:"امتلأ التخزين"};
 return {ok:1,id};
}
/* يفتح نسخةَ القائمة — خطوةُ تراجعٍ واحدة */
export async function recentOpen(id){
 const row=recentList().find(x=>x.id===id);
 if(!row)return {ok:0,err:"ليس في القائمة"};
 let d=null;
 try{d=await STORE.get(id)}catch(e){return {ok:0,err:"تعذّر القراءة"}}
 if(!d||!Array.isArray(d.walls))return {ok:0,err:"النسخة مفقودة"};
 let ok=false;
 try{edit(()=>{loadState(d,false); ok=true},"فتح مشروع أخير")}
 catch(e){return {ok:0,err:(e&&e.message)||"تعذّر التطبيق"}}
 if(!ok||editFailed())return {ok:0,err:"تعذّر التطبيق"};
 /* يعلو القائمةَ من جديد: فُتح الآن */
 const {list}=recentNote(recentList(),{...row,t:Date.now(),src:"open"});
 writeList(list);
 return {ok:1,n:row.n,w:d.walls.length};
}
export async function recentDrop(id){
 const L=recentList();
 if(!L.some(x=>x.id===id))return {ok:0};
 try{await STORE.del(id)}catch(e){}
 return {ok:writeList(L.filter(x=>x.id!==id))?1:0};
}
/* «قبل ٥ دقائق» — نصٌّ للعرض فقط، خالص */
export function agoText(t,now,en){
 const s=Math.max(0,Math.round(((now==null?Date.now():now)-(+t||0))/1000));
 if(s<60)return en?"just now":"الآن";
 const m=Math.round(s/60); if(m<60)return en?`${m} min ago`:`قبل ${m} د`;
 const h=Math.round(m/60); if(h<24)return en?`${h} h ago`:`قبل ${h} س`;
 const d=Math.round(h/24);
 if(d<30)return en?`${d} d ago`:`قبل ${d} يوم`;
 const mo=Math.round(d/30); return en?`${mo} mo ago`:`قبل ${mo} شهر`;
}
