/* ═══ قياس البوابة ب٠-٣: كم يُحرَّر من الإقلاع بنقل أدواتٍ نادرة إلى التحميل الكسول؟ ═══
   (م٠ · خطة تطوير أدوات الرسم §٤) — قياسٌ فقط، لا يعدّل ملفاً.

   لكل وحدة أدوات مستوردةٍ ساكناً عند الإقلاع:
   · المحرَّر = مجموعُ ما يخرج من رسم الإقلاع إن صارت الوحدةُ كسولة (هي وكلُّ
     ما لا يصل إليه أحدٌ غيرُها)، بالمقياس نفسه الذي يستعمله size-budget.js
     (gzip -9 لكل ملف).
   · كلفةُ العقب = عقبٌ حقيقيّ لكل أداةٍ تسجّلها الوحدة (id وalias وlabel
     وhint وico وstart يستورد الوحدة) مولَّدٌ من سجلّ الأدوات ثم مضغوط.
   · الصافي = المحرَّر − كلفة العقب.
   المعيار: الصافي للمرشّحين ≥ 20 ك.ب ⇒ عقبٌ مستقلّ لكل أداة مدنية؛ وإلا حزمةٌ كسولة واحدة.
   التشغيل: node scripts/lazy-cost.js [--json]                          */
import {readFileSync,existsSync,readdirSync} from "node:fs";
import {join,dirname,resolve,relative} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {gzipSync} from "node:zlib";
import {staticImports,entriesOf} from "./size-budget.js";

const ROOT=join(dirname(fileURLToPath(import.meta.url)),"..");
const SRC=join(ROOT,"src");
/* المرشّحون في الخطة: الماكرو، والرموز (كهرباء وأثاث وصحّيات · tools/parts)،
   وأدوات الأوراق — ومعها وحداتٌ نادرةُ الاستعمال الأخرى للمقارنة */
export const CANDIDATES=["src/tools/macros.js","src/tools/sheet.js","src/tools/showcase.js",
 "src/tools/elev.js","src/tools/section.js","src/tools/boqreport.js","src/tools/clouds.js","src/tools/roof.js"];
export const GATE_KB=20;

const gz=p=>gzipSync(readFileSync(p),{level:9}).length;
function graph(){
 const html=readFileSync(join(ROOT,"index.html"),"utf8");
 const {js}=entriesOf(html);
 const E=new Map();
 const visit=f=>{
  const abs=resolve(ROOT,f); if(E.has(abs)||!existsSync(abs))return;
  const deps=staticImports(readFileSync(abs,"utf8")).map(i=>resolve(dirname(abs),i)).filter(existsSync);
  E.set(abs,deps); deps.forEach(d=>visit(relative(ROOT,d)));
 };
 js.forEach(visit);
 return {E,roots:js.map(f=>resolve(ROOT,f))};
}
function reach(G,cut){
 const seen=new Set(), st=[...G.roots];
 while(st.length){const n=st.pop(); if(seen.has(n)||cut.has(n))continue; seen.add(n); (G.E.get(n)||[]).forEach(d=>st.push(d))}
 return seen;
}
export async function measureLazy(){
 const G=graph(), all=reach(G,new Set());
 const size=new Map([...all].map(p=>[p,gz(p)]));
 const freed=cut=>{const r=reach(G,cut); let b=0; all.forEach(p=>{if(!r.has(p))b+=size.get(p)}); return b};
 /* أيُّ أدواتٍ تسجّلها كلُّ وحدة؟ استيرادٌ متتالٍ وفرقُ السجلّ */
 const H=await import(pathToFileURL(join(SRC,"tests/harness.js")).href);
 H.shim(); H.shimCanvas(); H.shimDOM();
 const R=await import(pathToFileURL(join(SRC,"tools/registry.js")).href);
 const ids=()=>new Set(R.toolList().map(t=>t.id||t));
 const byMod={};
 for(const f of readdirSync(join(SRC,"tools")).filter(f=>f.endsWith(".js")).sort()){
  const before=ids(); await import(pathToFileURL(join(SRC,"tools",f)).href);
  byMod["src/tools/"+f]=[...ids()].filter(i=>!before.has(i)).map(i=>R.findTool(i));
 }
 const stub=(mod,T)=>`import {defTool} from "../tools/registry.js";\n`+T.map(d=>
  `defTool(${JSON.stringify({id:d.id,alias:d.alias,label:d.label,hint:d.hint,ico:d.ico})
  .replace(/}$/,`,start(c){import("${mod.replace("src/","../")}").then(()=>begin("${d.id}"));return false}})`)});`).join("\n");
 const rows=[];
 for(const [mod,T] of Object.entries(byMod)){
  const abs=resolve(ROOT,mod);
  if(!all.has(abs))continue;            /* ليست في الإقلاع أصلاً */
  const fr=freed(new Set([abs]));
  const sc=gzipSync(Buffer.from(stub(mod,T)),{level:9}).length;
  rows.push({mod,tools:T.length,ownKb:+(size.get(abs)/1024).toFixed(1),freedKb:+(fr/1024).toFixed(1),
   stubKb:+(sc/1024).toFixed(1),netKb:+((fr-sc)/1024).toFixed(1),cand:CANDIDATES.includes(mod)});
 }
 rows.sort((a,b)=>b.netKb-a.netKb);
 const cand=new Set(CANDIDATES.map(m=>resolve(ROOT,m)));
 const T=CANDIDATES.flatMap(m=>byMod[m]||[]);
 const candFreed=freed(cand);
 const candStub=CANDIDATES.reduce((s,m)=>s+gzipSync(Buffer.from(stub(m,byMod[m]||[])),{level:9}).length,0);
 const total={tools:T.length,freedKb:+(candFreed/1024).toFixed(1),stubKb:+(candStub/1024).toFixed(1),
  netKb:+((candFreed-candStub)/1024).toFixed(1)};
 total.gate=total.netKb>=GATE_KB;
 return {rows,total,bootKb:+([...all].reduce((s,p)=>s+size.get(p),0)/1024).toFixed(1)};
}

const isMain=process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]);
if(isMain){
 const r=await measureLazy();
 if(process.argv.includes("--json")){console.log(JSON.stringify(r,null,1)); process.exit(0)}
 console.log(`JS الإقلاع: ${r.bootKb} ك.ب مضغوطة\n`);
 console.log("الوحدة".padEnd(28)+"أدوات  ذاتها  المحرَّر  العقب  الصافي");
 r.rows.forEach(x=>console.log(`${x.cand?"★":" "} ${x.mod.padEnd(26)}${String(x.tools).padStart(4)}${String(x.ownKb).padStart(7)}${String(x.freedKb).padStart(9)}${String(x.stubKb).padStart(7)}${String(x.netKb).padStart(8)}`));
 const t=r.total;
 console.log(`\n★ المرشّحون معاً: ${t.tools} أداة · يُحرَّر ${t.freedKb} · العقب ${t.stubKb} · الصافي ${t.netKb} ك.ب`);
 console.log(`ب٠-٣ (≥ ${GATE_KB} ك.ب): ${t.gate?"تتحقق ⇒ عقبٌ مستقلّ لكل أداة مدنية":"لا تتحقق ⇒ حزمة مدني كسولة واحدة"}`);
}
