/* ═══ م٢ب · مصادر التقاط جديدة ═══ (خطة تطوير أدوات الرسم · ف٥)
   · الخطّ المتعدّد: رؤوسه ومنتصفات أضلاعه (والقوسيّ: منتصف القوس)، وأقربُ/عموديٌّ على أضلاعه.
   · العناصر الإنشائية: طرفا محور الكمرة ومنتصفه · أركان القاعدة ومركزها · رؤوس البلاطة.
   · نقاط تعريف الأبعاد (عقدة).
   · الأقرب والعمودي على خطوط المحاور نفسها لا على عقدها وحدها.
   · الطبقة المخفيّة لا تُلتقَط، والخطّاف snap في entreg لكل نوعٍ منها.
   التشغيل: node src/tests/osnap-sources.test.js                       */
import {shim,group,ok,eq,deep,summary} from "./harness.js";
shim();
const ST=await import("../core/state.js");
const RN=await import("../core/render.js");
const PL=await import("../core/plines.js");
const STR=await import("../core/struct.js");
const DM=await import("../core/dims.js");
const LY=await import("../core/layers.js");
const EN=await import("../core/entreg.js");
const OS=await import("../core/osnap.js");
const await_W=await import("../core/walls.js");
const S=()=>ST.S;
const reset=()=>{ST.newState(); ST.ensureShape(); RN.invalidate()};
const done=()=>{ST.touchGeom(); RN.invalidate()};
const only=(k,x,y,from)=>OS.osnap(x,y,200,from||null,{only:k});
const P=c=>c&&c.p;

group("م٢ب · الخطّاف snap معلَن للأنواع الجديدة",()=>{
 for(const k of ["pline","struct","dim","chain"])ok(typeof EN.ENT[k].snap==="function",`${k} يعلن snap`);
});

group("م٢ب · الخطّ المتعدّد",()=>{
 reset();
 PL.addPline([[0,0],[4000,0],[4000,3000]]);
 PL.addPline([[10000,0],[14000,0]],{bulge:[1]});
 done();
 deep(P(only("end",4050,40)),[4000,0],"رأسٌ وسطيّ (نهاية)");
 deep(P(only("end",4000,2950)),[4000,3000],"والطرف");
 deep(P(only("mid",2000,60)),[2000,0],"منتصف الضلع الأوّل");
 deep(P(only("mid",4050,1500)),[4000,1500],"ومنتصف الثاني");
 deep(P(only("near",1234,90)),[1234,0],"الأقرب على الضلع");
 deep(P(only("per",2500,100,[2500,-2000])),[2500,0],"العمودي من نقطة الأساس");
 const m=only("mid",12000,-2000);
 deep(P(m),[12000,-2000],"الضلع القوسيّ: منتصف القوس لا منتصف الوتر");
 eq(only("mid",12000,60),null,"ومنتصف الوتر ليس مرشّحاً");
});

group("م٢ب · العناصر الإنشائية",()=>{
 reset();
 STR.addBeam([0,0],[6000,0],300,600,"conc");
 STR.addFooting([10000,0],1600,1200,0,500,"conc");
 STR.addSlab([[20000,0],[25000,0],[25000,4000],[20000,4000]],150,"conc");
 done();
 deep(P(only("end",5960,40)),[6000,0],"طرف محور الكمرة");
 deep(P(only("mid",3000,60)),[3000,0],"ومنتصفه");
 deep(P(only("near",1500,100)),[1500,0],"والأقرب على المحور");
 deep(P(only("end",10790,590)),[10800,600],"ركن القاعدة");
 deep(P(only("cen",10040,30)),[10000,0],"ومركزها");
 deep(P(only("end",25040,3960)),[25000,4000],"رأس البلاطة");
 deep(P(only("mid",22500,4050)),[22500,4000],"ومنتصف ضلعها");
});

group("م٢ب · نقاط تعريف الأبعاد",()=>{
 reset();
 DM.addDim("h",[0,0],[3000,0],800);
 done();
 deep(P(only("nod",3030,20)),[3000,0],"نقطة التعريف الثانية (عقدة)");
 deep(P(only("nod",-20,20)),[0,0],"والأولى");
 eq(only("end",3030,20),null,"وليست «نهاية» (لا تخلط بنهايات الجدران)");
});

group("م٢ج · نقاط تقسيم سلسلة الأبعاد (عقدة)",()=>{
 reset();
 DM.addChain("h",[0,0],2000,[3000,2500,4000]);
 DM.addChain("v",[9000,0],11000,[1500,1500]);
 done();
 deep(P(only("nod",3030,2020)),[3000,2000],"التقسيم الأول للسلسلة الأفقية");
 deep(P(only("nod",5480,1980)),[5500,2000],"والثاني (مجموع القيَم)");
 deep(P(only("nod",9500,2010)),[9500,2000],"والنهاية");
 deep(P(only("nod",-30,2020)),[0,2000],"والبداية");
 deep(P(only("nod",11020,1480)),[11000,1500],"سلسلةٌ رأسية: نقطة تقسيمها");
 eq(only("end",3030,2020),null,"وليست «نهاية»");
 LY.layOf("A-DIMS").off=1; done();
 eq(only("nod",3030,2020),null,"الطبقة A-DIMS المخفيّة: لا تُلتقَط");
 LY.layOf("A-DIMS").off=0; done();
});

group("م٢ب · الأقرب والعمودي على خطوط المحاور",()=>{
 reset();
 S().grid.xs=[0,5000]; S().grid.ys=[0,4000];
 done();
 deep(P(only("near",5040,2000)),[5000,2000],"الأقرب على المحور الرأسي بعيداً عن العقد");
 deep(P(only("near",2500,3950)),[2500,4000],"وعلى الأفقي");
 deep(P(only("per",5050,1000,[9000,1000])),[5000,1000],"العمودي من الأساس على المحور");
 deep(P(only("nod",5030,4020)),[5000,4000],"والعقدة كما كانت");
});

group("م٢ب · الطبقة المخفيّة لا تُلتقَط",()=>{
 reset();
 PL.addPline([[0,0],[4000,0]]); STR.addBeam([0,2000],[4000,2000],300,600,"conc"); DM.addDim("h",[0,5000],[3000,5000],800);
 done();
 ok(!!only("end",3990,10),"قبل الإخفاء: يُلتقَط");
 for(const n of ["A-PLINE","A-STRU","A-DIMS"])LY.layOf(n).off=1;
 done();
 eq(only("end",3990,10),null,"الخطّ المتعدّد المخفيّ لا يُلتقَط");
 eq(only("end",3990,2010),null,"ولا الكمرة");
 eq(only("nod",2990,5010),null,"ولا البُعد");
 for(const n of ["A-PLINE","A-STRU","A-DIMS"])LY.layOf(n).off=0;
});

group("م٢ب · الأقدم يبقى: نهاية الجدار تفوز بالترتيب كما كانت",()=>{
 reset();
 const W=await_W;
 W.addWall([0,0],[4000,0],150,"int","c"); PL.addPline([[4000,0],[4000,3000]]);
 done();
 S().os.pick="order";
 const c=OS.osnap(4010,10,200,null);
 eq(c&&c.m,"end","نهاية"); deep(P(c),[4000,0],"على النقطة المشتركة");
});

summary();
