/* م١ · واجهة التعابير: الرقم البسيط هنا فوراً، والتعبير عبر expr.js
   الكسول (يُحمَّل عند أول رمز + * / ( ) - DMS). قبل وصوله: رفضٌ بسبب. */
import {norm} from "./units.js";
import {LIM} from "./limits.js";
let X=null, P=null;
export const exLoad=()=>P||(P=import("./expr.js").then(m=>X=m));
const OP=/[+*/()d°'"′″’”]|.-/;
export const exWarm=s=>{if(!X&&OP.test(String(s||"")))exLoad()};
const WAIT={err:"المحلّل الحسابي يُحمَّل — أعد المحاولة"};
const K={mm:1,"مم":1,cm:10,"سم":10,m:1000,"م":1000};
const nz=(v,c)=>{const s=norm(v==null?"":String(v)).replace(/\s+/g,""); return c?s.replace(/,/g,"."):s};
const late=(s,f)=>X?f():(exLoad(),s?WAIT:{err:"فارغ"});
export function exParse(v,def="m"){
 const s=nz(v,1), m=/^(-?\d*\.?\d+)(mm|cm|m|مم|سم|م)?$/.exec(s);
 if(m&&K[def]){
  const f=parseFloat(m[1])*K[m[2]||def], mm=Math.round(f);
  return Math.abs(mm)>LIM.coord.max?{err:"خارج الحدّ المسموح"}:{mm,f};
 }
 return late(s,()=>X.exParse(v,def));
}
export function exAng(v){
 const s=nz(v);
 return /^-?\d*\.?\d+$/.test(s)?{a:parseFloat(s)}:late(s,()=>X.exAng(v));
}
export const Ex=(v,def="m")=>{const r=exParse(v,def); return r.mm==null?null:r.mm};
/* معاينة الحقل: null لما ليس تعبيراً · {w} ينتظر التحميل */
export const exHint=(v,a)=>!OP.test(String(v||""))?null:X?X.exHint(v,a):(exLoad(),{w:1});
if(typeof document!=="undefined"&&document.addEventListener)
 document.addEventListener("input",e=>exWarm(e.target&&e.target.value),true);
