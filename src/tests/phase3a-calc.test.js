/* ═══ المرحلة ٣-أ من خطّة التطوير · حقيبة المهندس (v2.7.0) ═══
   ١ · كلُّ حاسبةٍ تعريفٌ صالح ولها ٣ حالات مرجعية على الأقل
   ٢ · كلُّ الحالات المرجعية تُطابَق ضمن السماحية
   ٣ · الإدخال بالأرقام العربية والفاصلة العشرية ووحدات مختلفة
   ٤ · الرفض الصريح للقيم الخارجة عن الحدود والمثلث المستحيل
   ٥ · حاسبةٌ جديدة بملفّ واحد تظهر تلقائياً في البحث والدليل والـPDF
   ٦ · أدوات المحرّك والوحدات والجداول بأسمائها (عقدٌ لا أثرٌ جانبيّ)
   ٧ · المداخل: الشريط وورقة الهاتف والعمل بلا اتصال وخارج رسم الإقلاع
   (v2.8.0) الكودُ المعتمد BS 8110: التثبيتُ والوصلة (الجدول 3.27) وفكُّ
   الشدّات (الجدول 6.3) بدل ACI 318 وACI 347. وحاسباتُ ٣-ب في phase3b.
   التشغيل:  node src/tests/phase3a-calc.test.js */
import {shim,group,ok,eq,near,deep,summary} from "./harness.js";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
shim();
const E=await import("../calc/engine.js");
const C=await import("../calc/index.js");
const U=await import("../calc/units.js");
const P=await import("../calc/pdf.js");
const T=await import("../calc/tables.js");
const D=await import("../calc/defs/rebarwt.js");
const A3=["general","concrete","steel"];
/* (v2.11.0) حاسباتُ ٣-أ بمعرّفاتها: ٣-د أضافت slabbar إلى مجموعة الحديد، فالعدُّ
   بالمجموعة كان يعطي 13 (وكان الإخفاق مخفيّاً لأن الملفّ يخرج بـ0) */
const IDS3A=["units","shapes","slope","triangle","mixdesign","concmat","concvol","formwork","rebarwt","barsarea","lapdev","spacing"];
const L3A=()=>C.calcList().filter(d=>IDS3A.includes(d.id));

group("١ · التعريفات صالحة وكلُّ حاسبةٍ لها ٣ حالات على الأقل",()=>{
 eq(L3A().length,12,"اثنتا عشرة حاسبة في ٣-أ");
 ok(L3A().every(d=>A3.includes(d.group)),"وكلُّها في مجموعات ٣-أ الثلاث");
 deep(C.GROUPS.map(g=>g.id).slice(0,3),A3,"مجموعات ٣-أ الثلاث أوّلاً");
 C.calcList().forEach(d=>{
  eq(E.validateDef(d).length,0,`${d.id}: تعريفٌ صالح`);
  ok(d.cases.length>=3,`${d.id}: ${d.cases.length} حالات مرجعية`);
  ok(/إرشادي|مهندس/.test(E.DISCLAIMER),"التنبيه الإلزامي موجود");
 });
});

group("٢ · الحالات المرجعية تُطابَق",()=>{
 C.calcList().forEach(d=>d.cases.forEach(c=>{
  const r=E.runCalc(d,c.in);
  ok(r.ok,`${d.id} · ${c.n}: الحساب يمرّ`);
  Object.entries(c.out).forEach(([k,want])=>{
   const got=r.out[k], tol=c.tol??1e-6;
   ok(typeof got==="number"&&Math.abs(got-want)<=tol*Math.max(1,Math.abs(want)),
    `${d.id} · ${c.n} · ${k} = ${got} (المتوقَّع ${want})`);
  });
 }));
});

group("٣ · الأرقام العربية والفاصلة والوحدات",()=>{
 eq(E.parseNum("١٢٫٥"),12.5,"أرقام عربية وفاصلة ٫");
 eq(E.parseNum("1,5"),1.5,"فاصلة لاتينية عشرية");
 ok(isNaN(E.parseNum("abc")),"نصٌّ يُرفض");
 const u=C.calcList().find(d=>d.id==="units");
 near(E.runCalc(u,{q:"len",x:"1,5",from:"m",to:"ft"}).out.y,4.921260,1e-5,"١٫٥ م = ٤٫٩٢١ قدم");
 const rc=C.calcList().find(d=>d.id==="rebarwt");
 near(E.runCalc(rc,{d:"16",n:1,L:"١٢",rho:7850}).out.W,18.9396,1e-3,"إدخال عربي");
 const sl=C.calcList().find(d=>d.id==="slope");
 near(E.runCalc(sl,{mode:"rr",rise:"٢٥",run:100}).out.pct,25,1e-9,"ميل من ارتفاع ومسافة");
 near(E.runCalc(rc,{d:"16",n:1,L:"1"},{L:"ft"}).out.Lt,0.3048,1e-6,"طول بالقدم يُحوَّل إلى المتر");
});

group("٤ · الرفض الصريح",()=>{
 const tr=C.calcList().find(d=>d.id==="triangle");
 ok(!E.runCalc(tr,{mode:"sss",a:1,b:1,c:5}).ok,"مثلثٌ مستحيل يُرفض");
 const lap=C.calcList().find(d=>d.id==="lapdev");
 ok(!E.runCalc(lap,{d:"16",fcu:"4"}).ok,"fcu خارج الحدود يُرفض");
 const mx=C.calcList().find(d=>d.id==="mixdesign");
 {const r=E.runCalc(mx,{fcu:"80"}); ok(!r.ok&&r.errs.some(e=>e.k==="fcu"),"خلطةٌ خارج المدى تُرفض على حقلها");}
 /* (v2.11.0 · DoE) fcu = 55 ⇒ fm = 68.1 ⇒ w/c ≈ 0.31 داخل المدى ؛ ومع RHPC عمر 7 أيام 60 ⇒ خارجه */
 {const r=E.runCalc(mx,{fcu:"60",age:"7",ca:"unc"}); ok(!r.ok&&/لا استقراء/.test(r.errs.map(e=>e.m).join(" ")),"w/c خارج مدى الشكل 4 يُرفض بلا استقراء");}
 {const r=E.runCalc(mx,{fcu:"30",wc4:"0.2"}); ok(!r.ok&&r.errs.some(e=>e.k==="wc4"),"w/c مُدخلة خارج الشكل 4 تُرفض على حقلها");}
 ok(!E.runCalc(C.calcById("rebarwt"),{d:"99"}).ok,"قطرٌ ليس في القائمة يُرفض");
 ok(!E.runCalc(C.calcById("rebarwt"),{L:"1"},{L:"furlong"}).ok,"وحدةٌ غير معروفة تُرفض");
 ok(!E.runCalc("nosuchcalc",{}).ok,"حاسبةٌ غير معروفة تُرفض");
 ok(E.runCalc(C.calcById("concvol"),{}).ok,"القيم الافتراضية وحدها تعطي نتيجة");
 const fw=C.calcList().find(d=>d.id==="formwork");
 eq(E.runCalc(fw,{el:"beamP",t:16}).out.r,14,"دعامات كمرة عند 16°C = 14 يوماً (BS 8110 الجدول 6.3)");
 ok(E.validateDef({...tr,id:"Bad ID"}).length>0,"id غير صالح يُكشف");
});

group("٥ · الاندماج: البحث والدليل والـPDF",()=>{
 const pe=C.paletteEntries();
 eq(pe.filter(x=>x.id!=="sel").length,C.calcList().length,"كلُّ حاسبة في لوحة الأوامر");
 ok(pe.some(x=>x.id==="sel"),"ومدخلُ «حاسبة للعنصر المحدَّد» (٣-د)");
 const L=C.calcLessons();
 eq(L.length,C.calcList().length,"درسٌ لكل حاسبة");
 ok(L.every(l=>l.kind==="calc"&&l.calcId&&l.body.includes("المرجع")),"الدرس يحمل المرجع");
 const pr=P.calcPDFPrims(E.runCalc(C.calcList()[0],{}));
 ok(pr.prims.length>10&&pr.page.w===210,"بناء أوّليّات PDF خالص بورقة A4");
 ok(pr.prims.some(p=>p.t==="text"&&String(p.s).includes("إرشادي")||String(pr.prims.map(x=>x.s||"").join(" ")).includes("إرشادية")),"التنبيه في الـPDF");
 /* حاسبةٌ جديدة بملفّ واحد: تُسجَّل وتظهر في البحث والدليل */
 const extra={id:"demoextra",group:"general",title:"حاسبة تجريبية",desc:"اختبار",aliases:"demo",
  ref:"اختبار",formula:["y = x"],inputs:[{k:"x",n:"x",kind:"len",unit:"m",def:2}],
  outputs:[{k:"y",n:"y",kind:"len",unit:"m",main:1}],compute:v=>({out:{y:v.x*2}}),
  cases:[{n:"a",src:"s",in:{x:1},out:{y:2}},{n:"b",src:"s",in:{x:2},out:{y:4}},{n:"c",src:"s",in:{x:3},out:{y:6}}]};
 E.defCalc(extra);
 eq(E.runCalc(extra,{x:"3"}).out.y,6,"الحاسبة الجديدة تعمل");
 ok(E.calcList().some(d=>d.id==="demoextra"),"تظهر في القائمة");
 ok(C.paletteEntries().some(e=>e.id==="demoextra"&&/demo/.test(e.hay)),"وفي Ctrl+K بلا لمس الواجهة");
 ok(C.calcLessons().some(l=>l.calcId==="demoextra"),"وفي الدليل");
 ok(P.calcPDFPrims(E.runCalc(extra,{x:1})).prims.some(p=>p.s==="حاسبة تجريبية"),"وفي الـPDF");
 let thrown=0; try{E.defCalc(extra)}catch(e){thrown=1}
 ok(thrown,"والتسجيلُ المكرَّر يُرفض");
 thrown=0; try{E.defCalc({...extra,id:"demobad",cases:extra.cases.slice(0,2)})}catch(e){thrown=1}
 ok(thrown&&!C.calcById("demobad"),"وتعريفٌ بأقلّ من ٣ حالات لا يُسجَّل");
});

group("٦ · أدوات المحرّك والوحدات والجداول",()=>{
 eq(E.fmt(1.23456,2),"1.23","fmt يقرّب");
 eq(E.fmt(2.5000,3),"2.5","fmt بلا أصفار ذيلية");
 eq(E.fmt(-0.0001,3),"0","fmt لا يكتب -0");
 eq(E.fmt(Infinity),"—","fmt لما ليس محدوداً");
 deep(E.GROUPS.map(g=>g.id).slice(0,3),A3,"المجموعات من المحرّك");
 eq(E.groupName("steel"),"الحديد","groupName"); eq(C.groupName("concrete"),"الخرسانة","groupName من الفهرس");
 eq(E.calcById("units"),C.calcById("units"),"calcById واحدٌ في المحرّك والفهرس");
 eq(C.DEFS.filter(d=>IDS3A.includes(d.id)).length,12,"DEFS: اثنتا عشرة من ٣-أ");
 const u=C.calcById("units");
 const dv=E.defaults(u);
 ok(dv.q==="len"&&dv.from&&dv.to,"defaults يملأ القوائم");
 const qi=u.inputs.find(i=>i.k==="q"), fi=u.inputs.find(i=>i.k==="from");
 ok(E.optsOf(qi,dv).length>=6,"optsOf لقائمة ثابتة");
 ok(E.optsOf(fi,{q:"press"}).some(o=>o.v==="MPa"),"optsOf لقائمة تابعة");
 const fx=E.fixSel(fi,{q:"press",from:"m"});
 ok(fx!=="m"&&E.optsOf(fi,{q:"press"}).some(o=>o.v===fx),"fixSel يصحّح وحدةً من نوعٍ آخر");
 ok(E.visible({k:"a"},{})&&!E.visible({k:"a",when:v=>v.z===1},{z:0}),"visible يتبع when");
 const r=E.runCalc(C.calcById("rebarwt"),{d:"16",n:10,L:12});
 const ir=E.inputRows(r), or=E.outputRows(r);
 ok(ir.some(x=>x.val==="Ø16 مم")&&ir.some(x=>x.unit==="م"),"inputRows بأسماء القوائم والوحدات");
 ok(or.some(x=>x.k==="W"&&x.main&&x.unit==="كجم"),"outputRows بالمخرج الرئيس ووحدته");
 const t=E.resultText(r);
 ok(t.includes("وزن حديد التسليح")&&t.includes("المرجع:")&&t.includes(E.DISCLAIMER),"resultText بالمرجع والتنبيه");
 ok(E.resultText(E.runCalc(C.calcById("triangle"),{mode:"sss",a:1,b:1,c:5})).includes("✗"),"resultText يحمل الخطأ");
 eq(E.interp([[0,0],[10,100]],2.5),25,"interp خطّي"); ok(isNaN(E.interp([[0,0],[10,100]],11)),"interp لا يستقرئ");
 near(E.PI,Math.PI,0,"PI"); near(E.rad(180),Math.PI,1e-12,"rad"); near(E.deg(Math.PI/2),90,1e-12,"deg");
 near(E.barArea(16),201.0619,1e-3,"barArea Ø16 = 201.06 مم²");
 near(U.convert(1,"press","ksi","MPa"),6.894757,1e-6,"convert ksi ⇒ MPa");
 near(U.convert(1,"force","tf","kN"),9.80665,1e-9,"convert tf ⇒ kN");
 ok(U.KINDS.len.base==="m"&&U.kindOf("nope")===U.KINDS.none,"KINDS وkindOf");
 ok(U.hasUnit("area","donum")&&!U.hasUnit("area","m"),"hasUnit");
 eq(U.unitName("len","mm"),"مم","unitName"); ok(U.unitList("moment").length>=6,"unitList");
 let th=0; try{U.convert(1,"len","m","kg")}catch(e){th=1} ok(th,"convert يرفض وحدةً من نوعٍ آخر");
 deep(D.DIAS.slice(0,3),[6,8,10],"DIAS أقطارٌ قياسية");
 /* (v2.11.0) لا جدول ACI باقٍ: الخلطةُ بطريقة DoE/BRE */
 ok(!("ACI211" in T)&&!("ACI347" in T)&&!("ACI318" in T)&&!("fcrNoData" in T),"لا جداول ACI: الكود المعتمد BS 8110 وحده");
 eq(T.DOE.f05.opc.cr[2],49,"DoE الجدول 2: OPC مكسَّر 28 يوماً = 49");
 eq(T.DOE.water[20].unc[1],160,"DoE الجدول 3: 20 مم طبيعي هبوط 10–30 = 160");
 eq(T.BS8110_DUR.wc[2],0.55,"BS 8110 الجدول 3.3: C40 ⇒ w/c 0.55");
 deep(T.durOf("severe"),{i:2,grade:40,wc:0.55,cmin:325,cover:40,n:T.BS8110_DUR.exp.severe.n},"durOf: الشديد ⇒ C40");
 eq(T.BS8110.beta.type2.t,0.5,"BS 8110 الجدول 3.26: β = 0.5 للمشرشر نوع 2 في الشدّ");
 eq(T.BS8110.gm.s,1.15,"γm للحديد 1.15 (A3:2007)");
 eq(T.BS8110_STRIKE.slabS.t16,4,"BS 8110 الجدول 6.3: باطن البلاطة 4 أيام");
});

group("٧ · المداخل: الشريط والهاتف وبلا اتصال وخارج الإقلاع",()=>{
 const ROOT=join(fileURLToPath(new URL(".",import.meta.url)),"..","..");
 const src=f=>readFileSync(join(ROOT,f),"utf8");
 ok(/act:"calcDlg"/.test(src("src/ui/ribbon/schema.js")),"زرٌّ في الشريط (حصر وتسعير)");
 ok(/calcDlg[\s\S]{0,120}calcPanel\.js/.test(src("src/ui/actions.js")),"وأكشنٌ يفتح اللوحة كسولاً");
 ok(/a:"calcDlg"/.test(src("src/shell/mobile/props-sheet.js")),"وفي ورقة «حصر وتسعير» على الهاتف");
 const sw=src("sw.js");
 ["engine","index","units","tables","pdf"].forEach(f=>ok(sw.includes(`./src/calc/${f}.js`),`sw.js يخزّن calc/${f}.js`));
 C.DEFS.forEach(d=>ok(sw.includes(`./src/calc/defs/${d.id}.js`),`وdefs/${d.id}.js — تعمل بلا اتصال`));
 ok(sw.includes("./src/ui/calcPanel.js"),"واللوحة");
});
const SB=await import("../../scripts/size-budget.js");
group("٧ب · الحاسبات خارج رسم الإقلاع",()=>{
 const ROOT=join(fileURLToPath(new URL(".",import.meta.url)),"..","..");
 const f=SB.measure(ROOT).files.map(x=>x.f.replace(/\\/g,"/"));
 eq(f.filter(x=>x.startsWith("src/calc/")).length,0,"لا ملفّ من calc/ في الإقلاع");
 ok(!f.includes("src/ui/calcPanel.js"),"ولا اللوحة");
});
summary();
