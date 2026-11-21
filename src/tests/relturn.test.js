/* ═══ م١ب · الانعطاف النسبي @L<<a وزوايا DMS ═══ (خطة تطوير أدوات الرسم §٤ م١ب)
   · @L<<a: زاويةٌ عن اتجاه الضلع السابق في الجلسة، والموجب يساراً.
   · أول ضلعٍ بلا سابق يُرفض برسالةٍ تسمّي البديل، و«<<» بلا @ يُرفض.
   · <<a وحدها تقفل الاتجاه منعطفاً عن الضلع السابق.
   · 45d30'15" و45°30'15" في كل حقل زاوية، وداخل التعابير (<90-12.5 · @3<<45d30').
   · الصيغ القديمة كما هي (@L<a · <a · 5<30 · المسافة المباشرة).
   · الإدخال الحركي وشريط اللمس: composeVals(…,rel) وزرّ «نسبي».
   التشغيل: node src/tests/relturn.test.js                                */
import {shim,shimCanvas,shimDOM,toolRig,group,ok,eq,near,summary} from "./harness.js";
import {readdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
shim(); shimCanvas();
const doc=shimDOM();
for(const id of ["cv","touchBar","optbar","thumb"]){
 const e=doc.createElement(id==="cv"?"canvas":"div");
 e.setAttribute("id",id); doc.body.appendChild(e);
}
if(!globalThis.window)globalThis.window={prompt:()=>null,confirm:()=>true};
const HERE=fileURLToPath(new URL(".",import.meta.url));
const ST=await import("../core/state.js");
const RN=await import("../core/render.js");
const CO=await import("../core/coords.js");
const EX=await import("../core/expr.js");
await (await import("../core/exq.js")).exLoad();
for(const f of readdirSync(HERE+"../tools").filter(f=>f.endsWith(".js")))await import(`../tools/${f}`);
const R=await import("../tools/registry.js");
const DY=await import("../ui/dyninput.js");
const TB=await import("../ui/touchbar.js");
const rig=toolRig(R,{invalidate:()=>RN.invalidate()});
const S=()=>ST.S;
const W=()=>S().walls;
const ang=w=>{let a=Math.atan2(w.b[1]-w.a[1],w.b[0]-w.a[0])*180/Math.PI; return a<0?a+360:a};
const len=w=>Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]);
function fresh(){ST.newState(); ST.ensureShape(); RN.invalidate(); rig.clear(); rig.defs("wall")}

group("زوايا DMS في المحلّل",()=>{
 const A=s=>EX.exAng(s).a;
 near(A(`45d30'15"`),45+30/60+15/3600,1e-9,`45d30'15"`);
 near(A(`45°30'15"`),45.504166667,1e-6,`45°30'15"`);
 near(A(`45d30'`),45.5,1e-12,`45d30'`);
 near(A(`45°`),45,1e-12,`45°`);
 near(A(`12d0'30"`),12+30/3600,1e-12,`ثوانٍ بلا دقائق تُقرأ صفراً`);
 near(A(`90-12.5`),77.5,1e-12,"تعبير 90-12.5");
 near(A(`45d30'+10`),55.5,1e-12,"DMS داخل تعبير");
 near(A(`-45d30'`),-45.5,1e-12,"سالب يشمل الدقائق");
 near(A(`(180-30)/2`),75,1e-12,"أقواس وقسمة");
 near(A(`٤٥d٣٠'`),45.5,1e-12,"أرقام عربية");
 near(A(`45.25`),45.25,1e-12,"عددٌ عشري كما كان");
 ok(EX.exAng(`45d70'`).a==null&&/60/.test(EX.exAng(`45d70'`).err),"دقائق ≥ 60 مرفوضة بسببها");
 ok(EX.exAng(`45d30'75"`).a==null,"ثوانٍ ≥ 60 مرفوضة");
 ok(EX.exAng(`5m`).a==null,"وحدة طولٍ في زاوية مرفوضة");
 ok(EX.exAng(`45+`).a==null,"تعبيرٌ ناقص مرفوض");
 ok(EX.exAng("").a==null,"الفارغ مرفوض");
 eq(EX.Ex(`45d`),null,"Ex (الأطوال) لا يقبل DMS");
});

group("parsePt: الصيغ الجديدة والقديمة",()=>{
 const P=(s,b,d,o)=>CO.parsePt(s,b,d,o);
 eq(JSON.stringify(P("@3<<90",[4000,0],null,{pa:0}).p),"[4000,3000]","@3<<90 بعد ضلعٍ على 0°");
 eq(JSON.stringify(P("@3<<-90",[4000,0],null,{pa:0}).p),"[4000,-3000]","السالب يميناً");
 eq(P("@3<<90",[4000,0]).c,"NO_PREV","بلا ضلعٍ سابق: NO_PREV");
 ok(/@4<0/.test(P("@3<<90",[4000,0]).m),"والرسالة تذكر البديل @4<0");
 eq(P("3<<90",[0,0],null,{pa:0}).c,"REL_AT","<< بلا @ مرفوض");
 eq(P("<<90",null,null,{pa:30}).a,120,"<<90 قفلٌ منعطف");
 eq(P("<<90",null,null,{}).c,"NO_PREV","<<90 بلا سابق مرفوض");
 eq(P(`<45d30'`).a,45.5,"قفلٌ بزاوية DMS");
 eq(P(`<90-12.5`).a,77.5,"قفلٌ بتعبير");
 const q=P(`@3<45°30'15"`,[0,0]);
 near(Math.atan2(q.p[1],q.p[0])*180/Math.PI,45.504,0.02,"قطبيٌّ نسبي بزاوية DMS");
 const r=P(`@3<<45d30'`,[0,0],null,{pa:10});
 near(Math.atan2(r.p[1],r.p[0])*180/Math.PI,55.5,0.02,"@3<<45d30' بعد 10°");
 eq(JSON.stringify(P("5<30").p),"[4330,2500]","5<30 كما كان");
 eq(JSON.stringify(P("@3.1<30",[0,0]).p),"[2685,1550]","@3.1<30 كما كان");
 eq(P("<45").a,45,"<45 كما كان");
 eq(P("@<45",[0,0]).a,45,"@<45 كما كان");
 eq(JSON.stringify(P("2",[0,0],[1,0]).p),"[2000,0]","المسافة المباشرة كما كانت");
 eq(P("abc",[0,0]),null,"ما ليس صيغةً يبقى null (اسم أداة)");
 eq(P("<abc"),null,"<abc ليست زاوية ولا ترمي");
 /* القلم الدقيق: الأساس غير المقرَّب يُستعمل ويُعاد */
 const e=P("@1<0",[1,0],null,{x:[0.6,0.4]});
 eq(JSON.stringify(e.p),"[1001,0]","الحساب من x غير المقرَّب");
 near(e.x[0],1000.6,1e-9,"وx الناتجة غير مقرَّبة");
});

group("أداة الجدار: سلسلة بانعطافات نسبية",()=>{
 fresh();
 R.begin("wall"); rig.at(0,0);
 ["@4<0","@3<<90","@4<<90"].forEach(s=>rig.type(s));
 eq(W().length,3,"ثلاثة جدران");
 eq(JSON.stringify(W()[1].b),"[4000,3000]","الثاني ينعطف 90° يساراً");
 eq(JSON.stringify(W()[2].b),"[0,3000]","والثالث كذلك");
 rig.type("c");
 eq(W().length,4,"C يغلق المستطيل");
 eq(JSON.stringify(W()[3].b),"[0,0]","على النقطة الأولى");
 rig.clear();
 rig.at(10000,0); rig.type("@4<<90");
 eq(W().length,4,"بعد C سلسلةٌ جديدة: لا ضلع سابق");
 ok(rig.said(/ضلعاً سابقاً/,"er"),"والرفض بسببه");
 rig.esc();
});

group("أول ضلع · Enter · U · غير المتّصل",()=>{
 fresh();
 R.begin("wall"); rig.at(0,0); rig.clear();
 rig.type("@3<<90");
 eq(W().length,0,"أول ضلعٍ منعطف مرفوض");
 ok(rig.said(/اكتب @4<0/,"er"),"برسالة الخطة");
 rig.type("@4<30"); rig.type("@2<<-30");
 eq(W().length,2,"ضلعٌ مطلق ثم منعطف");
 near(ang(W()[1]),0,0.03,"30 ثم -30 = 0°");
 rig.type("u");
 eq(W().length,1,"U يتراجع ضلعاً");
 rig.type("@2<<60");
 near(ang(W()[1]),90,0.03,"المنعطف بعد U عن الضلع الباقي (30+60)");
 rig.enter(); rig.clear();
 rig.at(10000,0); rig.type("@1<<90");
 eq(W().length,2,"بعد Enter سلسلةٌ جديدة بلا سابق");
 rig.esc();
 fresh();
 R.setOpt("wall","chain",0);
 R.begin("wall"); rig.at(0,0);
 rig.type("@4<0"); rig.type("@3<<90");
 eq(W().length,2,"غير المتّصل يحفظ اتجاه الضلع السابق");
 eq(JSON.stringify(W()[1].b),"[4000,3000]","وينعطف عنه");
 rig.esc(); rig.defs("wall");
});

group("مضلّعٌ منتظم بالانعطاف وحده: ١٢ ضلعاً",()=>{
 fresh();
 R.begin("wall"); rig.at(0,0);
 rig.type("@2<0");
 for(let i=0;i<10;i++)rig.type("@2<<30");
 rig.type("c");
 eq(W().length,12,"اثنا عشر ضلعاً");
 let e=0; W().forEach(w=>{e=Math.max(e,Math.abs(len(w)-2000))});
 ok(e<=1.5,`كل ضلعٍ 2 م (أقصى خطأ ${e.toFixed(2)} مم)`);
 rig.esc();
});

group("خطوة الزاوية (ang) تقبل DMS والتعابير",()=>{
 fresh();
 const st={ang:1,k:"a",p:"الزاوية",each(ctx,v){ctx.v.got=v}};
 R.defTool({id:"_angprobe",label:"مجسّ",steps:[{p:"أساس"},st,{p:"نهاية"}]});
 R.begin("_angprobe"); rig.at(0,0); rig.type(`30d15'`);
 near(R.T.ctx.v.got,30.25,1e-9,"30d15' في خطوة الزاوية");
 rig.esc();
 R.begin("_angprobe"); rig.at(0,0); rig.type("90-12.5");
 near(R.T.ctx.v.got,77.5,1e-9,"تعبيرٌ في خطوة الزاوية");
 rig.esc();
 R.begin("_angprobe"); rig.at(0,0); rig.type("45");
 eq(R.T.ctx.v.got,45,"رقمٌ مجرّد كما كان");
 rig.esc(); rig.clear();
 R.begin("_angprobe"); rig.at(0,0); rig.type(`45d70'`);
 ok(rig.said(/ليست زاوية/,"er"),"DMS فاسدة مرفوضة بسببها");
 rig.esc();
});

group("الإدخال الحركي وشريط اللمس: التركيب",()=>{
 const F=[{k:"L"},{k:"a"}];
 eq(DY.composeVals(F,["3","90"]),"@3<90","مطلق كما كان");
 eq(DY.composeVals(F,["3","90"],true),"@3<<90","rel ⇒ @L<<a");
 eq(DY.composeVals(F,["3","<90"]),"@3<<90","زاويةٌ تبدأ بـ< ⇒ منعطفة");
 eq(DY.composeVals(F,["","90"],true),"<<90","قفلٌ منعطف");
 eq(DY.composeVals(F,["",`45d30'`]),`<45d30'`,"DMS يمرّ كما هو");
 eq(DY.composeVals(F,["3",""],true),"3","الطول وحده لا يتأثر");
 fresh();
 R.begin("wall"); rig.at(0,0); rig.type("@4<0");
 R.feedText(DY.composeVals(F,["3","90"],true));
 eq(JSON.stringify(W()[1].b),"[4000,3000]","المسار نفسه: حقلا اللمس مع «نسبي»");
 eq(R.prevAng(),90,"prevAng مُصدَّرة لأزرار الزوايا");
 rig.esc();
});

group("شريط اللمس: زرّ «نسبي» والزوايا الجاهزة",()=>{
 fresh(); TB.resetTouchBar();
 R.begin("wall"); rig.at(0,0); rig.type("@4<0");
 R.T.ghost=[4000,1000];
 TB.syncTouchBar();
 const b=doc.querySelector("#touchBar .tbRel");
 ok(!!b,"الزرّ يظهر مع حقلي الطول والزاوية");
 eq(b&&b.getAttribute("aria-pressed"),"false","مطفأ افتراضاً");
 TB.runTouch("rel");
 eq(b&&b.getAttribute("aria-pressed"),"true","اللمسة تشغّله");
 TB.applyMeasure(["3","90"]);
 eq(JSON.stringify(W()[1].b),"[4000,3000]","طبّق مع «نسبي» ⇒ @3<<90");
 TB.pickAngle(90);
 eq(R.T.lock,180,"الزاوية الجاهزة 90 منعطفةً عن ضلعٍ على 90° ⇒ قفل 180°");
 TB.pickAngle(90);
 eq(R.T.lock,null,"لمسةٌ ثانية تفكّ القفل");
 TB.runTouch("rel");
 TB.pickAngle(90);
 eq(R.T.lock,90,"بلا «نسبي» الزاوية مطلقة كما كانت");
 rig.esc(); TB.resetTouchBar();
});

summary();
