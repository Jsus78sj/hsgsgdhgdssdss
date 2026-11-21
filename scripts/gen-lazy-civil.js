#!/usr/bin/env node
/* ═══ توليد عقب الأدوات المدنية الكسولة ═══ إكمال م١ (ب٠-٣)
   src/ui/lazy-civil.js يُولَّد من السجلّ الحقيقي: لكل أداةٍ في الوحدات
   النادرة تُؤخَذ حقولُها الساكنة (id · alias · label · hint · opts · ico ·
   own · nojr · noplan · stay · arg · destruct …) بلا الدوال ولا steps.
   فلا تتخلّف بيانات العقب عن تعريف الأداة (البحث والشريط والخطط وقائمة
   الأوامر تقرؤها قبل التحميل). ويحرسه lazy-civil.test.js بـ--check.
   التشغيل:  node scripts/gen-lazy-civil.js  [--check]                      */
import {readFileSync,writeFileSync} from "node:fs";
import {join,dirname} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";

const ROOT=join(dirname(fileURLToPath(import.meta.url)),"..");
const OUT=join(ROOT,"src/ui/lazy-civil.js");

/* الوحدة ← معرّفات أدواتها. وحدةٌ جديدة تُضاف هنا وتُولَّد. */
export const MODULES=[
 ["roof","tools/roof.js",["roof"]],
 ["boqreport","tools/boqreport.js",["report"]],
 ["elev","tools/elev.js",["elev"]],
 ["section","tools/section.js",["section"]],
 ["sheet","tools/sheet.js",["vport","detail","addsheet","renamesheet","delsheet",
  "nextsheet","prevsheet","vpclip"]],
 ["clouds","tools/clouds.js",["cloud","cloude"]],
 ["macros","tools/macros.js",["macrorec","macroplay","macrodel","macrolist"]]
];

function plain(d,where){
 const o={};
 for(const k of Object.keys(d)){
  const v=d[k];
  if(typeof v==="function"||k==="steps"||k==="lazy")continue;
  const bad=JSON.stringify(v,(_,x)=>{if(typeof x==="function")throw new Error("fn");return x});
  if(bad===undefined)continue;
  o[k]=v;
 }
 if(!o.id)throw new Error(`تعريفٌ بلا id في ${where}`);
 return o;
}

export async function build(){
 const R=await import(pathToFileURL(join(ROOT,"src/tools/registry.js")).href);
 const before=new Set(R.toolList());
 const defs=[];
 for(const [name,file,ids] of MODULES){
  await import(pathToFileURL(join(ROOT,"src",file)).href);
  const mine=ids.map(id=>{
   const d=R.findTool(id);
   if(!d||d.lazy)throw new Error(`الأداة «${id}» غير مسجَّلة من ${file}`);
   return plain(d,file);
  });
  /* كلُّ أداةٍ سجّلتها الوحدة يجب أن تكون في القائمة، وإلا بقيت بلا عقب */
  const all=R.toolList().filter(d=>!before.has(d)&&!ids.includes(d.id));
  if(all.length)throw new Error(`${file} سجّلت أدواتٍ خارج القائمة: ${all.map(d=>d.id).join(" ")}`);
  R.toolList().forEach(d=>before.add(d));
  defs.push([name,file,mine]);
 }
 const L=[];
 L.push(`/* ═══ عقبُ الأدوات المدنية الكسولة ═══ مولَّد من السجلّ — لا يُحرَّر يدوياً`);
 L.push(`   npm run lazy:gen · يحرسه lazy-civil.test.js (إكمال م١ · ب٠-٣).`);
 L.push(`   الاسمُ والخياراتُ هنا، والوحدةُ الحقيقية تُحمَّل عند أول استعمال وتستبدل`);
 L.push(`   العقب (defTool يكتب فوق المعرّف نفسه). التحميلُ المسبق في الخمول يجعل`);
 L.push(`   الأداةَ جاهزةً غالباً قبل أول نقرة. */`);
 L.push(`import {defTool,TOOLS} from "../tools/registry.js";`);
 L.push(`const L=(d,f)=>{const o=TOOLS[d.id]; if(!o||o.lazy)defTool(Object.assign(d,{lazy:f}))};`);
 for(const [name,file,list] of defs){
  L.push(`const ${name}=()=>import("../${file}");`);
  for(const d of list)L.push(`L(${JSON.stringify(d)},${name});`);
 }
 L.push(`if(typeof document!=="undefined"){`);
 L.push(` const idle=globalThis.requestIdleCallback||(f=>setTimeout(f,3000));`);
 L.push(` idle(()=>{[${defs.map(x=>x[0]).join(",")}].forEach(f=>f().catch(()=>{}))});`);
 L.push(`}`);
 return L.join("\n")+"\n";
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 const text=await build();
 if(process.argv.includes("--check")){
  let cur="";
  try{cur=readFileSync(OUT,"utf8")}catch(e){}
  if(cur!==text){console.error("lazy-civil.js قديم — شغّل: npm run lazy:gen"); process.exit(1)}
  console.log("lazy-civil.js سليم");
 }else{
  writeFileSync(OUT,text);
  console.log(`كُتب ${OUT} (${text.length} حرفاً)`);
 }
}
