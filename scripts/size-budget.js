#!/usr/bin/env node
/* ═══ ميزانيةُ الإقلاع ═══ المرحلة ١ من خطة التطوير (G1)
   كان رقمُ «≈ 403 ك.ب مضغوطة» يُقاس يدوياً ويُكتَب في CHANGES.md،
   فلا شيءَ يمنع الحزمةَ من أن تكبر بصمت. هنا قياسٌ آليٌّ واحد:

     • الوحدات: كلُّ ما يُستورَد **ساكناً** (import … from) بدءاً من
       نقاط الدخول الثلاث في index.html. الاستيرادُ الكسول import() لا
       يُحسَب — فهو لا يُحمَّل عند الإقلاع، وهذا بالضبط ما نريد مكافأته.
     • الأنماط: كلُّ <link rel="stylesheet"> في index.html.
     • index.html نفسُه.
   كلُّ ملفٍّ يُضغَط gzip (المستوى 9) منفرداً — كما يرسله الخادم.

   الوضعان:
     node scripts/size-budget.js            المصدر الخام (التطوير)
     node scripts/size-budget.js --dir dist ناتجُ build-dist (مصغَّر/مجمَّع)
     --json                                 مخرجٌ آليّ
     --max <KB>                             الحدّ (افتراضاً BUDGET أدناه)
   يخرج بـ1 عند التجاوز فيوقف CI.                                          */
import {readFileSync,existsSync} from "node:fs";
import {join,dirname,resolve,relative} from "node:path";
import {fileURLToPath} from "node:url";
import {gzipSync} from "node:zlib";

const ROOT=join(dirname(fileURLToPath(import.meta.url)),"..");
/* الحدود بالكيلوبايت المضغوط. «src» للمصدر الخام، و«dist» للناتج المنشور.
   هدفُ الخطّة 350 للمنشور؛ والخامُ أعلى لأنه بلا تصغير. */
/* الحدودُ على القياس الفعليّ بعد المرحلة ١ (لا أمنيات): المصدرُ الخام 803.7
   ك.ب، وdist المجمَّع 398 ك.ب. الحدُّ حارسٌ يمنع العودة إلى الوراء بهامشٍ
   صغير، والهدفُ في خطة التطوير (350 للمجمَّع) يُنزَل إليه الحدُّ مع كل
   تقسيمٍ جديد — لا يُرفَع الحدُّ ليمرّ تغييرٌ أثقل. */
export const BUDGET={src:820,dist:405};

const STATIC_RE=/(?:^|[;\n}])\s*(?:import|export)\s*(?:[\w*{}\s,$]+?\s*from\s*)?["']([^"']+)["']/g;

export function staticImports(code){
 /* نتجاهل التعليقات أوّلاً كي لا يُحسَب استيرادٌ مذكورٌ في شرح */
 const s=code.replace(/\/\*[\s\S]*?\*\//g,"").replace(/(^|[^:"'`])\/\/[^\n]*/g,"$1");
 const out=[]; let m; STATIC_RE.lastIndex=0;
 while((m=STATIC_RE.exec(s)))if(m[1].startsWith("."))out.push(m[1]);
 return out;
}

export function entriesOf(html){
 const js=[...html.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+)"/g)].map(m=>m[1].replace(/^\.\//,""));
 const css=[...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(m=>m[1].replace(/^\.\//,""));
 return {js,css};
}

export function measure(dir=ROOT){
 const html=readFileSync(join(dir,"index.html"),"utf8");
 const {js,css}=entriesOf(html);
 const seen=new Set(), missing=[];
 const visit=f=>{
  const abs=resolve(dir,f);
  if(seen.has(abs))return;
  if(!existsSync(abs)){missing.push(relative(dir,abs));return}
  seen.add(abs);
  staticImports(readFileSync(abs,"utf8")).forEach(i=>visit(relative(dir,resolve(dirname(abs),i))));
 };
 js.forEach(visit);
 const gz=p=>gzipSync(readFileSync(p),{level:9}).length;
 const files=[...seen].map(p=>({f:relative(dir,p),raw:readFileSync(p).length,gz:gz(p)}));
 const styles=css.filter(c=>existsSync(join(dir,c))).map(c=>({f:c,raw:readFileSync(join(dir,c)).length,gz:gz(join(dir,c))}));
 const htmlGz=gzipSync(Buffer.from(html),{level:9}).length;
 const sum=a=>a.reduce((t,x)=>t+x.gz,0);
 const total=sum(files)+sum(styles)+htmlGz;
 return {modules:files.length,jsGz:sum(files),cssGz:sum(styles),htmlGz,total,
  kb:+(total/1024).toFixed(1),missing,files:files.sort((a,b)=>b.gz-a.gz)};
}

const isMain=process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]);
if(isMain){
 const a=process.argv, at=k=>{const i=a.indexOf(k);return i>0?a[i+1]:null};
 const dirArg=at("--dir"), dir=dirArg?resolve(ROOT,dirArg):ROOT;
 const mode=dirArg?"dist":"src";
 const max=+(at("--max")||BUDGET[mode]);
 const r=measure(dir);
 if(a.includes("--json")){console.log(JSON.stringify({...r,max,mode,files:r.files.slice(0,15)},null,1))}
 else{
  console.log(`الإقلاع (${mode}): ${r.modules} وحدةً ساكنة · JS ${(r.jsGz/1024).toFixed(1)} · CSS ${(r.cssGz/1024).toFixed(1)} · HTML ${(r.htmlGz/1024).toFixed(1)} ك.ب`);
  console.log(`المجموع ${r.kb} ك.ب مضغوطة · الحدّ ${max}`);
  console.log("أثقلُ عشر وحدات:");
  r.files.slice(0,10).forEach(x=>console.log(`  ${(x.gz/1024).toFixed(1).padStart(6)}  ${x.f}`));
 }
 if(r.missing.length){console.error("استيرادٌ ساكنٌ لملفٍّ مفقود:",r.missing.join(", "));process.exit(1)}
 if(r.kb>max){console.error(`✗ تجاوز الميزانية: ${r.kb} > ${max} ك.ب`);process.exit(1)}
 console.log("✓ ضمن الميزانية");
}
