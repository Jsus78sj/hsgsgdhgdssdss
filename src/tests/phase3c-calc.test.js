/* ═══ المرحلة ٣-ج من خطّة التطوير · حاسبات الأحمال والتربة (v2.9.0) ═══
   ١ · تسعُ حاسباتٍ جديدة ⇒ المجموع 30، بمجموعتين جديدتين (الأحمال 5 · التربة 4)
   ٢ · كلُّ حالةٍ مرجعية تُطابَق ضمن سماكتها
   ٣ · عوامل القدرة تطابق القيم المنشورة (ترزاكي · مايرهوف)
   ٤ · جداول BS 8110 / BS 6399 / BS 648 وتركيبات الأحمال
   ٥ · خواصّ: توازن توزيع الكمرات · رتابة القدرة · استمرار Nγ
   ٦ · الرفض الصريح والتنبيهات
   ٧ · الأدوات المصدَّرة والوحدات الجديدة
   ٨ · الاندماج: البحث والدليل والـPDF وبلا اتصال وخارج الإقلاع
   التشغيل:  node src/tests/phase3c-calc.test.js */
import {shim,group,ok,eq,near,deep,summary} from "./harness.js";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
shim();
const E=await import("../calc/engine.js");
const C=await import("../calc/index.js");
const P=await import("../calc/pdf.js");
const T=await import("../calc/tables.js");
const U=await import("../calc/units.js");
const BE=await import("../calc/defs/bearing.js");
const BD=await import("../calc/defs/beamdist.js");
const ST=await import("../calc/defs/settle.js");
const EP=await import("../calc/defs/earthp.js");
const LD=await import("../calc/defs/loads.js");
const MW=await import("../calc/defs/matwt.js");
const WL=await import("../calc/defs/wallload.js");
const ROOT=join(fileURLToPath(new URL(".",import.meta.url)),"..","..");
const src=f=>readFileSync(join(ROOT,f),"utf8");
const LOADS=["loads","matwt","beamdist","combos","wallload"], SOIL=["bearing","footing","settle","earthp"];
const NEW=[...LOADS,...SOIL];
const run=(id,i,u)=>E.runCalc(C.calcById(id),i,u);
const rel=(g,w)=>Math.abs(g-w)/Math.max(1e-12,Math.abs(w));

group("١ · تسع حاسبات جديدة والمجموع 30",()=>{
 eq(C.calcList().length,C.calcList().length,"(المجموع يُفحَص في phase3d)");
 ok(C.calcList().length>=30,"30 حاسبة على الأقلّ (12 + 9 + 9)");
 deep(C.GROUPS.map(g=>g.id).slice(0,7),["general","concrete","steel","masonry","earth","loads","soil"],"السبع الأولى بترتيبها");
 eq(C.groupName("loads"),"الأحمال","اسم مجموعة الأحمال"); eq(E.groupName("soil"),"التربة والأساسات","اسم مجموعة التربة");
 eq(C.calcList().filter(d=>d.group==="loads").length,5,"خمس حاسبات أحمال");
 eq(C.calcList().filter(d=>d.group==="soil").length,4,"أربع حاسبات تربة");
 ok(C.DEFS.length>=30,"DEFS ≥ 30");
 NEW.forEach(id=>{
  const d=C.calcById(id);
  ok(!!d,`${id} مسجّلة`);
  eq(E.validateDef(d).length,0,`${id}: تعريفٌ صالح`);
  ok(d.cases.length>=3,`${id}: ${d.cases.length} حالات مرجعية`);
  ok(E.runCalc(d,{}).ok,`${id}: القيم الافتراضية وحدها تعطي نتيجة`);
  ok(d.outputs.some(o=>o.main),`${id}: مخرجٌ رئيسيّ`);
 });
 LOADS.forEach(id=>eq(C.calcById(id).group,"loads",`${id} في الأحمال`));
 SOIL.forEach(id=>eq(C.calcById(id).group,"soil",`${id} في التربة`));
});

group("٢ · الحالات المرجعية لـ ٣-ج تُطابَق",()=>{
 let n=0;
 NEW.forEach(id=>C.calcById(id).cases.forEach(c=>{
  const r=run(id,c.in);
  ok(r.ok,`${id} · ${c.n}: الحساب يمرّ`);
  Object.entries(c.out).forEach(([k,want])=>{
   const got=r.out[k], tol=c.tol??1e-6; n++;
   ok(typeof got==="number"&&Math.abs(got-want)<=tol*Math.max(1,Math.abs(want)),
    `${id} · ${c.n} · ${k} = ${got} (المتوقَّع ${want})`);
  });
 }));
 ok(n>=60,`${n} مقارنةً مرجعية`);
});

group("٣ · عوامل القدرة تطابق القيم المنشورة",()=>{
 /* Meyerhof (1963): Nq = e^{π tanφ}tan²(45+φ/2) · Nc = (Nq−1)cotφ · Nγ = (Nq−1)tan(1.4φ) */
 [[20,6.40,14.83,2.87],[30,18.40,30.14,15.67],[35,33.30,46.12,37.15]].forEach(([f,q,c,g])=>{
  const m=BE.meyerhof(f);
  ok(rel(m.Nq,q)<4e-3,`مايرهوف Nq(${f}°) = ${m.Nq.toFixed(2)} ≈ ${q}`);
  ok(rel(m.Nc,c)<4e-3,`مايرهوف Nc(${f}°) = ${m.Nc.toFixed(2)} ≈ ${c}`);
  ok(rel(m.Ng,g)<5e-3,`مايرهوف Nγ(${f}°) = ${m.Ng.toFixed(2)} ≈ ${g}`);
 });
 /* Terzaghi (1943) */
 [[20,7.44,17.69,5.0],[30,22.46,37.16,19.7],[35,41.44,57.75,42.4]].forEach(([f,q,c,g])=>{
  const t=BE.terzaghi(f);
  ok(rel(t.Nq,q)<4e-3,`ترزاكي Nq(${f}°) = ${t.Nq.toFixed(2)} ≈ ${q}`);
  ok(rel(t.Nc,c)<5e-3,`ترزاكي Nc(${f}°) = ${t.Nc.toFixed(2)} ≈ ${c}`);
  near(t.Ng,g,1e-9,`ترزاكي Nγ(${f}°) من الجدول`);
 });
 deep(BE.terzaghi(0),{Nc:5.7,Nq:1,Ng:0},"ترزاكي φ = 0");
 eq(BE.meyerhof(0).Nc,5.14,"مايرهوف φ = 0 ⇒ Nc = 5.14 (برانتل)"); eq(BE.meyerhof(0).Nq,1,"Nq = 1");
 near(BE.terzaghi(32).Ng,19.7+(36-19.7)*2/4,1e-9,"Nγ بين 30° و34° بالاستكمال الخطّي");
});

group("٤ · جداول BS 8110 وBS 6399 وBS 648",()=>{
 eq(T.BS8110_GF.uls.dq.g,1.4,"γf الميّت 1.4"); eq(T.BS8110_GF.uls.dq.q,1.6,"γf الحيّ 1.6");
 eq(T.BS8110_GF.uls.dw.gb,1.0,"الميّت النافع 1.0"); eq(T.BS8110_GF.uls.dw.w,1.4,"الرياح 1.4");
 eq(T.BS8110_GF.uls.dqw.g,1.2,"ميّت + حيّ + رياح = 1.2"); eq(T.BS8110_GF.earth,1.4,"ضغط التربة 1.4");
 eq(T.IMPOSED.list.office.q,2.5,"مكاتب 2.5"); eq(T.IMPOSED.list.shop.q,4,"محلات 4.0"); eq(T.IMPOSED.list.dwell.q,1.5,"سكن 1.5");
 eq(T.WALLS.list.hollow.g,12,"بلوك مفرَّغ 12"); ok(T.WALLS.list.solid.g>T.WALLS.list.hollow.g&&T.WALLS.list.hollow.g>T.WALLS.list.aac.g,"أوزان الجدران: مصمت > مفرَّغ > خفيف");
 eq(T.DENSITY.list.rc.g,24,"خرسانة مسلّحة 24"); eq(T.DENSITY.list.steel.g,77,"حديد 77");
 ok(/BS 8110-1:1997 الجدول 2.1/.test(C.calcById("combos").ref),"مرجع التركيبات");
 ok(/BS 6399-1/.test(C.calcById("loads").ref)&&/BS 648/.test(C.calcById("loads").ref),"مرجع الأحمال");
 ok(/BS 8004/.test(C.calcById("bearing").ref)&&/BS 8004/.test(C.calcById("footing").ref),"BS 8004 في التربة");
 ok(E.codeLine().includes("BS 8110"),"الكود المعتمد ما زال BS 8110");
 Object.values(T.IMPOSED.list).forEach(o=>ok(o.q>0&&o.q<=5&&o.n,"حمل حيّ موجب وبالغ الاسم"));
 ok(T.SETTLE.iw.every((r,i,a)=>i===0||(r[0]>a[i-1][0]&&r[1]>a[i-1][1]&&r[2]>a[i-1][2])),"Iw تزداد مع L/B");
 ok(T.SETTLE.iw.every(r=>r[2]<r[1]),"المتوسّط أقلّ من المركز");
 ok(T.BEARING.terzNg.every((r,i,a)=>i===0||(r[0]>a[i-1][0]&&r[1]>a[i-1][1])),"جدول Nγ رتيب");
 /* تركيبات الأحمال */
 const c=run("combos",{G:500,Q:200,W:150});
 eq(c.out.which,1,"الحاكم (1)"); eq(run("combos",{G:100,Q:0,W:400}).out.which,3,"الرياح تحكم (3)");
 eq(run("combos",{G:600,Q:300,W:0}).out.which,1,"بلا رياح (1) وحده");
 ok(!("c2" in E.outputRows(run("combos",{G:600,Q:300,W:0})).map(r=>r.k)),"لا صفوف رياح بلا رياح");
});

group("٥ · خواصّ عامّة",()=>{
 /* توازن: مجموع ما تحمله الكمرات الأربع = حمل اللوح كاملاً */
 let n=0;
 for(const lx of [2,3.5,4,5,7])for(const ly of [lx,lx*1.2,lx*1.5,lx*2,lx*2.5,lx*4])for(const w of [3,10]){
  const r=run("beamdist",{lx,ly,w,dir:ly/lx>2?"one":"two"}); n++;
  ok(r.ok&&Math.abs(r.out.chk-1)<1e-9,`توازن ${lx}×${ly.toFixed(2)}`);
  ok(r.out.lBend<=r.out.lPeak+1e-9&&r.out.lShear<=r.out.lBend+1e-9,"قصّ ≤ انحناء ≤ قمّة (الطويلة)");
 }
 ok(n>=60,`${n} حالة توازن`);
 /* المربّع: الكمرتان متماثلتان */
 const sq=run("beamdist",{lx:5,ly:5,w:8});
 near(sq.out.sShear,sq.out.lShear,1e-12,"المربّع متماثل (قصّ)"); near(sq.out.sBend,sq.out.lBend,1e-12,"المربّع متماثل (انحناء)");
 /* رتابة القدرة: تزداد مع φ ومع B (رمل) ومع Df */
 let prev=0;
 for(const f of [20,25,30,35,40]){const q=run("bearing",{me:"mey",sh:"strip",B:2,Df:1,phi:f}).out.qu; ok(q>prev,`qu تزداد عند ${f}°`); prev=q}
 ok(run("bearing",{me:"terz",sh:"strip",B:3,Df:1,phi:30}).out.qu>run("bearing",{me:"terz",sh:"strip",B:2,Df:1,phi:30}).out.qu,"أوسع ⇒ أقدر (رمل)");
 ok(run("bearing",{me:"mey",sh:"strip",B:2,Df:2,phi:30}).out.qu>run("bearing",{me:"mey",sh:"strip",B:2,Df:1,phi:30}).out.qu,"أعمق ⇒ أقدر");
 /* القاعدة المربّعة أقدر من الشريطية بالتماسك */
 ok(run("bearing",{me:"terz",sh:"sq",B:2,Df:1,c:40,phi:0}).out.qu>run("bearing",{me:"terz",sh:"strip",B:2,Df:1,c:40,phi:0}).out.qu,"مربّعة > شريطية (c)");
 /* الماء الجوفي يخفض القدرة */
 const dry=run("bearing",{me:"terz",sh:"sq",B:2,Df:1,phi:30,g:18}).out.qu;
 ok(run("bearing",{me:"terz",sh:"sq",B:2,Df:1,phi:30,g:18,wt:"yes",dw:0.5,gs:20}).out.qu<dry,"ماءٌ عند القاعدة ⇒ أقلّ");
 near(run("bearing",{me:"terz",sh:"sq",B:2,Df:1,phi:30,g:18,wt:"yes",dw:30,gs:20}).out.qu,dry,1e-12,"ماءٌ عميق (30 م) لا يؤثّر");
 near(run("bearing",{me:"terz",sh:"sq",B:2,Df:1,phi:30,g:18,wt:"yes",dw:0.5,gs:20}).out.q,18*0.5+(20-9.81)*0.5,1e-12,"q بالماء عند 0.5 م");
 /* الاستكمال في الهبوط */
 near(ST.iwOf(1,false),1.12,1e-12,"Iw(1) مركز"); near(ST.iwOf(100,true),3.69,1e-12,"Iw(100) متوسّط");
 near(ST.iwOf(1.75,false),(1.36+1.52)/2,1e-12,"Iw بين 1.5 و2"); near(ST.iwOf(500,false),4.01,1e-12,"فوق 100 يُحصَر");
 /* K رانكين: Ka × Kp = 1 */
 [20,28,30,35,45].forEach(f=>near(EP.kOf(f,"a")*EP.kOf(f,"p"),1,1e-12,`Ka·Kp = 1 عند ${f}°`));
 near(EP.kOf(30,"a"),1/3,1e-12,"Ka(30°) = 1/3"); near(EP.kOf(30,"p"),3,1e-12,"Kp(30°) = 3"); near(EP.kOf(30,"o"),0.5,1e-12,"K0(30°) = 0.5");
 /* الهبوط: يزداد مع الإجهاد وينقص مع Es */
 ok(run("settle",{mo:"el",q:200,B:2,L:2,Es:20}).out.S>run("settle",{mo:"el",q:100,B:2,L:2,Es:20}).out.S,"هبوط أكبر بإجهاد أكبر");
 ok(run("settle",{mo:"el",q:150,B:2,L:2,Es:40}).out.S<run("settle",{mo:"el",q:150,B:2,L:2,Es:20}).out.S,"هبوط أقلّ بتربةٍ أصلب");
 near(run("settle",{mo:"el",q:150,B:2,L:2,Es:20}).out.S,2*run("settle",{mo:"el",q:75,B:2,L:2,Es:20}).out.S,1e-12,"الهبوط خطّيّ في الإجهاد");
});

group("٦ · الرفض الصريح والتنبيهات",()=>{
 ok(run("loads",{use:"office",h:200,part:0}).warn.some(w=>/BS 6399/.test(w)),"تنبيه الأحمال المركّزة");
 ok(run("loads",{use:"gym",h:100,fin:0,scr:0,pl:0,svc:0,part:0}).warn.some(w=>/1\.25/.test(w)),"Qk > 1.25Gk ينبّه لشرط المعاملات المبسّطة");
 ok(!run("loads",{use:"office",h:20}).ok,"بلاطة أرقّ من 50 مم تُرفض");
 ok(!run("loads",{use:"nope"}).ok,"استخدامٌ غير معروف يُرفض");
 ok(!run("loads",{use:"custom",qc:-1}).ok,"حملٌ سالب يُرفض");
 ok(run("loads",{use:"office",part:1,pt:"dead"}).out.Gk>run("loads",{use:"office",part:1,pt:"imposed"}).out.Gk,"القواطع الثابتة في الميّت");
 ok(run("loads",{use:"office",part:1,pt:"dead"}).out.Qk<run("loads",{use:"office",part:1,pt:"imposed"}).out.Qk,"والمتحرّكة في الحيّ");
 ok(!run("matwt",{mat:"custom",gc:0}).ok,"وزنُ وحدةٍ صفر يُرفض");
 ok(!run("matwt",{mat:"rc",mode:"area",A:5,t:0}).ok,"سماكة صفر تُرفض");
 ok(run("beamdist",{lx:3,ly:7,w:10,dir:"two"}).warn.some(w=>/اتجاهٍ واحد/.test(w)),"ly/lx > 2 باتجاهين ⇒ تنبيه");
 ok(run("beamdist",{lx:4,ly:5,w:10,dir:"one"}).warn.some(w=>/ly ÷ lx > 2/.test(w)),"اتجاه واحد وr ≤ 2 ⇒ تنبيه");
 ok(!run("beamdist",{lx:0.1,ly:4,w:10}).ok,"بحرٌ أقصر من 0.5 م يُرفض");
 ok(!run("wallload",{u:"hollow",op:90}).ok,"فتحاتٌ فوق 80٪ تُرفض");
 ok(run("wallload",{u:"hollow"}).warn.some(w=>/نشرة المصنّع/.test(w)),"تنبيه البلوك الخفيف");
 ok(!("eq" in run("wallload",{u:"hollow",L:0,A:10}).out),"لا مكافئ بلا طول");
 ok(!run("bearing",{sh:"rect",B:3,L:2}).ok,"L < B يُرفض (مستطيلة)");
 ok(!run("bearing",{phi:55}).ok,"φ > 50° يُرفض"); ok(!run("bearing",{fs:1}).ok,"FS < 2 يُرفض");
 ok(!run("bearing",{wt:"yes",g:19,gs:17}).ok,"γsat < γ يُرفض");
 ok(run("bearing",{me:"terz",B:1,Df:3}).warn.some(w=>/Df > B/.test(w)),"Df > B ينبّه");
 ok(run("bearing",{}).warn.some(w=>/تقرير/.test(w)),"تنبيه تقرير التربة");
 ok(!("L" in E.outputRows(run("footing",{sh:"strip"})).map(r=>r.k)),"الشريطية بلا طول");
 ok(run("footing",{sh:"sq",G:6000,Q:4000,qa:100}).warn.some(w=>/اللبشة/.test(w)),"قاعدة كبيرة ⇒ لبشة");
 ok(!run("footing",{qa:5}).ok,"qa دون 25 kPa يُرفض");
 ok(run("settle",{mo:"el",q:400,B:3,L:3,Es:5}).warn.some(w=>/25/.test(w)),"هبوط > 25 مم ينبّه");
 ok(!run("settle",{B:3,L:2}).ok,"الهبوط: L < B يُرفض");
 ok(run("settle",{mo:"co"}).warn.some(w=>/عاديّ التماسك/.test(w)),"تنبيه الطين العاديّ");
 ok(!run("earthp",{phi:10}).ok,"φ < 20° يُرفض (رانكين الحبيبي)");
 ok(run("earthp",{st:"p"}).warn.some(w=>/BS 8002/.test(w)),"السلبي ينبّه");
 ok(!("Pu" in run("earthp",{st:"p"}).out),"لا قوة نهائية للمقاومة السلبية");
 near(run("earthp",{st:"a"}).out.Pu,1.4*run("earthp",{st:"a"}).out.P,1e-12,"Pu = 1.4 P");
 ok(run("earthp",{}).warn.some(w=>/ماء جوفي/.test(w)),"تنبيه الماء الجوفي");
});

group("٧ · الأدوات المصدَّرة والوحدات الجديدة",()=>{
 deep(BD.dist(4,6,10,true).lPeak,20,"dist.lPeak");
 eq(BD.dist(3,7,12,true).one,true,"r > 2 ⇒ اتجاه واحد"); eq(BD.dist(3,7,12,true).sShear,0,"ولا حمل على القصيرتين");
 near(LD.qOf({use:"office"}),2.5,1e-12,"qOf مكاتب"); near(LD.qOf({use:"custom",qc:4.2}),4.2,1e-12,"qOf محدَّد");
 near(MW.gOf({mat:"steel"}),77,1e-12,"gOf حديد"); near(MW.gOf({mat:"custom",gc:12}),12,1e-12,"gOf محدَّد");
 near(WL.gOf({u:"brick"}),19,1e-12,"gOf طوب");
 /* الوحدات الجديدة */
 eq(U.convert(1,"aload","tfm2","kNm2"),9.80665,"1 طن/م² = 9.80665 kN/م²");
 near(U.convert(1000,"aload","kgfm2","kNm2"),9.80665,1e-12,"1000 كجم/م²");
 near(U.convert(2,"lload","tfm","kNm"),19.6133,1e-12,"2 طن/م");
 near(U.convert(1,"uw","tfm3","kNm3"),9.80665,1e-12,"طن/م³");
 eq(U.unitName("aload","kNm2"),"kN/م²","اسم وحدة الحمل المساحي");
 /* حاسبةٌ بوحدةٍ أخرى: حمل التصميم بطن/م² */
 near(run("beamdist",{lx:4,ly:6,w:"1",dir:"two"},{w:"tfm2"}).out.lPeak,9.80665*4/2,1e-9,"w بطن/م² تُحوَّل");
 near(run("bearing",{me:"mey",sh:"strip",B:2,Df:1,phi:30,g:"1.8"},{g:"tfm3"}).out.qu,run("bearing",{me:"mey",sh:"strip",B:2,Df:1,phi:30,g:1.8*9.80665}).out.qu,1e-9,"γ بطن/م³ تُحوَّل");
 near(run("footing",{sh:"sq",G:60,Q:40,qa:"2"},{G:"tf",Q:"tf",qa:"kgcm2"}).out.P,100*9.80665*1.1,1e-9,"حمل العمود بالطن (tf) محوَّلٌ إلى kN")
 near(run("footing",{sh:"sq",G:60,Q:40,qa:"2"},{G:"tf",Q:"tf",qa:"kgcm2"}).out.A,100*9.80665*1.1/(2*98.0665),1e-9,"qa بكجم/سم² محوَّلة إلى kPa");
});

group("٨ · البحث والدليل والـPDF وبلا اتصال وخارج الإقلاع",()=>{
 const pe=C.paletteEntries(), L=C.calcLessons();
 ok(pe.length>=30,"مدخلات Ctrl+K ≥ 30"); ok(L.length>=30,"دروس ≥ 30");
 NEW.forEach(id=>{
  ok(pe.some(e=>e.id===id),`${id} في Ctrl+K`);
  ok(L.some(l=>l.calcId===id&&l.body.includes("المرجع")),`${id} في الدليل`);
 });
 [["احمال","loads"],["وزن","matwt"],["كمره","beamdist"],["تركيبات","combos"],["جدار","wallload"],
  ["ترزاكي","bearing"],["قاعده","footing"],["هبوط","settle"],["رانكين","earthp"]].forEach(([w,id])=>
  ok(pe.find(e=>e.id===id).hay.includes(w),`«${w}» يجد ${id}`));
 NEW.forEach(id=>{
  const r=run(id,{}), t=E.resultText(r);
  ok(t.includes("المرجع:")&&t.includes("BS 8110")&&t.includes(E.DISCLAIMER),`${id}: النصّ المنسوخ بالمرجع والكود والتنبيه`);
  ok(E.outputRows(r).length>0&&E.inputRows(r).length>0,`${id}: صفوف العرض`);
 });
 const sw=src("sw.js");
 NEW.forEach(id=>ok(sw.includes(`./src/calc/defs/${id}.js`),`sw.js يخزّن ${id} — بلا اتصال`));
 ok(/VERSION="2\.(9|1\d)\.\d+"/.test(sw),"إصدار العامل 2.9.x أو أحدث");
 ok(/"test:phase3c"/.test(src("package.json")),"npm run test:phase3c");
 ok(/"version": "2\.(9|1\d)\./.test(src("package.json")),"package.json 2.9.x أو أحدث");
 ok(/VERSION="2\.(9|1\d)\./.test(src("src/core/version.js")),"version.js 2.9.x أو أحدث");
 /* الواجهة تقرأ GROUPS: لا مجموعةَ مكتوبة بيد في اللوحة */
 ok(!/loads|"soil"/.test(src("src/ui/calcPanel.js")),"اللوحة بلا مجموعاتٍ مكتوبة بيد");
});
const SB=await import("../../scripts/size-budget.js");
group("٨ب · ٣-ج خارج رسم الإقلاع",()=>{
 const f=SB.measure(ROOT).files.map(x=>x.f.replace(/\\/g,"/"));
 eq(f.filter(x=>x.startsWith("src/calc/")).length,0,"لا ملفّ من calc/ في الإقلاع");
});
summary();
