/* ═══ القياس داخل التطبيق نفسه ═══ (م٠ · البوابة ب٠-٢ · زمن الإطار الحقيقي)
   تحقنه صفحةُ القياس (bench/index.html) في نافذة التطبيق التي فتحتها (index.html
   من الأصل نفسه)، فيُستورد core وui/canvas.js بالعناوين نفسها التي حمّلها
   التطبيق ⇒ النسخُ نفسها من الوحدات، والرسّامُ هو ui/canvas.js الحقيقي لا رسّامٌ مبسَّط.
   · الحفظ يُعلَّق أولاً (saveHold — آليةُ الدروس نفسها): مشروع المستخدم المحفوظ
     لا يُكتب فوقه، والمشروع المولَّد في الذاكرة فقط. أغلق النافذة بعد القياس.
   · زمن الإطار = من طلب الرسم (draw) حتى ما بعد إطار الرسم (rAF تالٍ في الطابور نفسه).
   · لا سكربت مضمَّن ولا eval: ملفٌّ من الأصل نفسه، فيعمل تحت CSP كما هي.
   لا يستورده index.html ولا sw.js ولا size-budget: خارج الإقلاع. */
import * as ST from "../src/core/state.js";
import * as RN from "../src/core/render.js";
import * as OS from "../src/core/osnap.js";
import * as CV from "../src/ui/canvas.js";
import {build10k,stat} from "./gen10k.js";

const raf=()=>new Promise(r=>requestAnimationFrame(()=>r()));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const f=v=>+v.toFixed(2);
const S=o=>({mean:f(o.mean),p95:f(o.p95),max:f(o.max)});
/* إطارٌ واحد بالرسّام الحقيقي: draw() تطلب إطاراً، وrAF بعده في الطابور نفسه */
async function frame(){const t0=performance.now(); CV.draw(); await raf(); return performance.now()-t0}

async function run(){
 ST.saveHold(1);
 const out={view:null};
 let t0=performance.now(); const G=build10k(); out.buildMs=f(performance.now()-t0); out.n=G.n;
 CV.fit(); await frame();
 const full=[]; for(let i=0;i<20;i++){RN.invalidate(); full.push(await frame()); await sleep(16)}
 out.frameFull=S(stat(full));           /* إعادة طلاء كاملة بالمشهد المخبَّأ */
 const pan=[]; for(let i=0;i<20;i++){CV.panBy(4,0); pan.push(await frame())}
 out.framePan=S(stat(pan));
 const mv=[]; for(let i=0;i<5;i++){const w=ST.S.walls[300+i]; w.b=[w.b[0]+100,w.b[1]];
  ST.touchGeom(); RN.invalidate(); mv.push(await frame()); await sleep(16)}
 out.frameAfterMove=S(stat(mv));        /* المشهد يُبنى من جديد ثم يُطلى: ما يراه المستخدم بعد تعديل */
 /* الالتقاط داخل التطبيق: الدالة نفسها، دفعاتٌ من 10 لتجاوز دقة المؤقّت */
 const B=10, T=[]; for(let i=0;i+B<=G.Q.length;i+=B){t0=performance.now();
  for(let j=i;j<i+B;j++)OS.osnap(G.Q[j][0],G.Q[j][1],320); T.push((performance.now()-t0)/B)}
 out.osnapBatch10=S(stat(T));
 out.view={k:+CV.V.k.toPrecision(3),w:CV.V.w,h:CV.V.h,dpr:devicePixelRatio};
 return out;
}
window.__cdBench=run;
