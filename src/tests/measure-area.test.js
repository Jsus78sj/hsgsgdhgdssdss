/* ═══ م١أ · المساحة من ثلاث نقاط ═══
   كانت تبدأ من أربع نقاط (P.length>3) فيُعطى المثلث «المسافة» وحدها. */
import {shim,shimCanvas,shimDOM,toolRig,group,ok,eq,summary} from "./harness.js";
import {readdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
shim(); shimCanvas(); shimDOM();
const HERE=fileURLToPath(new URL(".",import.meta.url));
const ST=await import("../core/state.js");
for(const f of readdirSync(HERE+"../tools").filter(f=>f.endsWith(".js")))await import(`../tools/${f}`);
const R=await import("../tools/registry.js");
const RN=await import("../core/render.js");
const EN=await import("../core/ents.js");
const rig=toolRig(R,{hit:(x,y,k)=>EN.hitTest(x,y,150,k),invalidate:()=>RN.invalidate()});

group("مثلث 4×3 م: المساحة 6.000 م²",()=>{
 ST.newState(); ST.ensureShape(); rig.clear();
 R.begin("measure"); rig.at(0,0); rig.at(4000,0); rig.at(0,3000); rig.enter();
 ok(rig.said(/المساحة 6\.000 م²/),`السطر: ${rig.last()}`);
});
group("مربّع 4×4 م: المساحة 16.000 م² والمسافة كما هي",()=>{
 ST.newState(); ST.ensureShape(); rig.clear();
 R.begin("measure"); rig.at(0,0); rig.at(4000,0); rig.at(4000,4000); rig.at(0,4000); rig.enter();
 ok(rig.said(/المساحة 16\.000 م²/),`السطر: ${rig.last()}`);
});
group("قياس مفتوح من نقطتين: مسافة وزاوية بلا مساحة",()=>{
 ST.newState(); ST.ensureShape(); rig.clear();
 R.begin("measure"); rig.at(0,0); rig.at(3000,4000); rig.enter();
 const s=rig.last();
 ok(/المسافة 5\.000 م/.test(s)&&/الزاوية/.test(s),`السطر: ${s}`);
 ok(!/المساحة/.test(s),"لا مساحة لخط مفتوح من نقطتين");
});
group("المثلث المفتوح: المسافة 9.000 م كما كانت · والمغلق بـC: المحيط 12.000 والمساحة 6.000",()=>{
 ST.newState(); ST.ensureShape(); rig.clear();
 R.begin("measure"); rig.at(0,0); rig.at(4000,0); rig.at(0,3000); rig.enter();
 ok(/المسافة 9\.000 م/.test(rig.last())&&!/المحيط/.test(rig.last()),`المفتوح: ${rig.last()}`);
 rig.clear();
 R.begin("measure"); rig.at(0,0); rig.at(4000,0); rig.at(0,3000); rig.type("c");
 const s=rig.last();
 ok(/المحيط 12\.000 م/.test(s)&&/المساحة 6\.000 م²/.test(s),`المغلق: ${s}`);
});
group("الخيار close: المحيط والمساحة معاً · وافتراضيُّه مطفأ",()=>{
 ST.newState(); ST.ensureShape(); rig.clear();
 eq(+R.ov("measure","close")||0,0,"الافتراضيّ مطفأ");
 R.setOpt("measure","close",1);
 R.begin("measure"); rig.at(0,0); rig.at(4000,0); rig.at(4000,4000); rig.at(0,4000); rig.enter();
 const s=rig.last();
 ok(/المحيط 16\.000 م/.test(s)&&/المساحة 16\.000 م²/.test(s),`السطر: ${s}`);
 R.setOpt("measure","close",0);
 rig.clear(); R.begin("measure"); rig.at(0,0); rig.at(4000,0); rig.type("c");
 ok(rig.said(/ثلاث نقاط/),"C بنقطتين يُرفض بسببه");
 R.cancel(true);
});
summary();
