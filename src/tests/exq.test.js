/* ═══ م١ · المحلّل الحسابي كسول (core/exq.js) ═══
   معيار قبول م١: «حجم الإقلاع يزيد ≤ 1.5 ك.ب، وإلا يُنقل المحلّل إلى
   وحدة كسولة تُحمَّل عند أول رمز + - * / (». قيس 3.8 ك.ب فنُقل.
   يحرس: الرقمُ البسيط فوريّ · التعبيرُ قبل التحميل يُرفض برسالةٍ لا
   بقراءةٍ خاطئة · exWarm يبدأ التحميل عند أول رمز · expr.js خارج
   رسم الإقلاع الساكن · والمعاينة «= 3.750 م». */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
import {group,ok,eq,summary} from "./harness.js";
const Q=await import("../core/exq.js");
const {parsePt}=await import("../core/coords.js");
const ROOT=join(fileURLToPath(new URL(".",import.meta.url)),"..","..");

group("قبل التحميل: الرقمُ البسيط فوريّ والتعبيرُ يُرفض بسببه",()=>{
 eq(Q.Ex("3.6"),3600,"3.6 م");
 eq(Q.Ex("150mm"),150,"150mm");
 eq(Q.Ex("-2"),-2000,"-2 م");
 eq(Q.Ex("٣٫٦"),3600,"الرقم العربي");
 eq(Q.Ex("3600","mm"),3600,"الوحدة الافتراضية للحقل");
 eq(Q.exAng("45").a,45,"زاوية مجرّدة");
 const r=Q.exParse("3.6+0.15");
 ok(r.mm==null&&/يُحمَّل/.test(r.err),`التعبير قبل التحميل: ${r.err}`);
 const p=parsePt("@3.6+0.15<90",[0,0]);
 ok(p&&p.k==="err","parsePt لا تقرأ التعبير خطأً قبل التحميل");
 eq(Q.exHint("3.6",0),null,"لا معاينة لرقمٍ بسيط");
 ok(Q.exHint("3.6+0.15",0).w===1,"المعاينة تنتظر التحميل");
 eq(Q.exParse("").err,"فارغ","الفارغ");
});
/* exWarm: رقمٌ بسيط لا يحمّل شيئاً، وأول رمزٍ يحمّل */
Q.exWarm("3.6"); Q.exWarm("-3");
await Q.exWarm("3.6+")||Q.exLoad();
await Q.exLoad();
group("بعد التحميل: التعابير والمعاينة",()=>{
 eq(Q.Ex("3.6+0.15"),3750,"3.6+0.15");
 eq(Q.Ex("(12-0.2)/3"),3933,"(12-0.2)/3");
 eq(Q.Ex("4m+150mm"),4150,"4m+150mm");
 eq(Q.exAng("45d30'").a,45.5,"DMS");
 eq(Q.exHint("3.6+0.15",0).t,"= 3.750 م","معاينة الطول");
 eq(Q.exHint("90-12.5",1).t,"= 77.5°","معاينة الزاوية");
 const h=Q.exHint("3.6+",0);
 ok(h.bad&&/غير مكتمل/.test(h.t),`الرفض: ${h.t}`);
 eq(JSON.stringify(parsePt("@3.6+0.15<90",[0,0]).p),"[0,3750]","parsePt بعد التحميل");
});
const {measure}=await import("../../scripts/size-budget.js");
group("expr.js خارج رسم الإقلاع الساكن",()=>{
 const m=measure(ROOT);
 const fs=m.files.map(x=>x.f);
 ok(!fs.includes("src/core/expr.js"),"expr.js ليس في الإقلاع");
 ok(fs.includes("src/core/exq.js"),"exq.js في الإقلاع");
 const src=readFileSync(join(ROOT,"src/core/exq.js"),"utf8");
 ok(!/^\s*import[^(]*expr\.js/m.test(src),"لا استيراد ساكن لـexpr.js");
 ok(!/\beval\(|new Function/.test(src+readFileSync(join(ROOT,"src/core/expr.js"),"utf8")),"بلا eval ولا Function");
});
summary();
