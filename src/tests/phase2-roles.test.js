/* ═══ المرحلة ٢ من خطّة التطوير · تجربة الاستخدام حسب الدور (v2.6.0) ═══
   حارسُ ما أُضيف في 2.4 → 2.6 ولم يكن له اختبارٌ سلوكيّ:
   ١ · مساحاتُ العمل (roles.js) ومرشِّحُ الشريط واختيارُ أوّل تشغيل
   ٢ · معلوماتُ المشروع (projinfo.js): التطبيع · التجريد · المراجعات · الشعار
   ٣ · التسعيرُ يقرأ عملةَ المشروع وضريبتَه ويعود لافتراض الجهاز
   ٤ · شعارُ المكتب المتّجه (sheet.js#logoPrims)
   ٥ · المشاريعُ الأخيرة (io/recents.js) بمخزنٍ محقون
   ٦ · الترجمة (i18n/en.js) والاهتزاز القابل للإطفاء
   ٧ · ربطُ أوّل تشغيل في الترحيب ومركز المشروع (ساكن)
   التشغيل:  node src/tests/phase2-roles.test.js                        */
import {shim,group,groupAsync,ok,eq,deep,summary} from "./harness.js";
shim();
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
const ROOT=join(fileURLToPath(new URL(".",import.meta.url)),"..","..");
const src=f=>readFileSync(join(ROOT,f),"utf8");

const {ROLES,ROLE_IDS,ROLE_ICON,isRole,roleName,roleRibbon,roleOrder,shouldAskRole}=await import("../ui/roles.js");
const {RIBBON}=await import("../ui/ribbon/schema.js");
const {CODES,SIGS,REV_MAX,REV_ALL,LOGO_SHAPES,STAMPF,newTitleKeys,monogramOf,normTitleExt,
 stripTitleExt,revAdd,revDel,codeName,projCurrency,projVat,logoText,logoShape,lastRev,infoLines}=await import("../core/projinfo.js");
const {S}=await import("../core/state.js");
const P=await import("../core/pricing.js");
const {logoPrims}=await import("../core/sheet.js");
const RC=await import("../io/recents.js");
const {EN}=await import("../i18n/en.js");
const PL=await import("../platform/index.js");

/* ══ ١ · الأدوار ══ */
group("مساحاتُ العمل: ستّةُ أدوارٍ والمرشِّحُ لا يُتلف الأساس",()=>{
 deep(ROLE_IDS,["arch","str","srv","site","qs","stu"],"الأدوارُ الستّة بترتيب الخطّة");
 ROLE_IDS.forEach(id=>{ok(!!ROLE_ICON[id],`${id}: له رمز`); ok(roleName(id)===ROLES[id].n,`${id}: اسمُه`)});
 eq(roleName(""),"كل الأدوات","«» = كل الأدوات");
 ok(!isRole("toString")&&!isRole("__proto__"),"لا يُخدَع بخصائص النموذج");
 const snap=JSON.stringify(RIBBON);
 ROLE_IDS.forEach(id=>{
  const T=roleRibbon(RIBBON,id);
  ok(T.length>0,`${id}: الشريطُ ليس فارغاً`);
  ok(T.every(t=>t.panels.length>0),`${id}: لا تبويبَ بلا ألواح`);
 });
 eq(JSON.stringify(RIBBON),snap,"الأساسُ لم يُمسّ");
 eq(roleRibbon(RIBBON,"").length,RIBBON.length,"بلا دور ⇒ الشريطُ كاملاً");
 const str=roleRibbon(RIBBON,"str");
 const n=T=>T.reduce((a,t)=>a+t.panels.length,0);
 ok(n(str)<n(RIBBON),`الإنشائيُّ يرى ألواحاً أقلّ (${n(str)}/${n(RIBBON)})`);
 eq(roleRibbon([{id:"zz",panels:[{id:"p"}]}],"str")[0].id,"zz","لا تطابق ⇒ يعود الشريطُ لا فراغ");
});
group("القوالبُ مرتّبةٌ بالدور",()=>{
 const L=["room","villa","grid10x9","apt3"];
 eq(roleOrder(L,"str")[0],"grid10x9","الإنشائيُّ: شبكةُ المحاور أوّلاً");
 eq(roleOrder(L,"stu")[0],"room","الطالب: الغرفة أوّلاً");
 deep(roleOrder(L,""),L,"بلا دور ⇒ الترتيبُ كما هو");
 deep(L,["room","villa","grid10x9","apt3"],"الأصلُ لم يُمسّ");
});
group("اختيارُ الدور في أوّل تشغيل يُسأل مرّةً واحدة",()=>{
 ok(shouldAskRole({role:"",roleAsked:0},{}),"أوّلُ تشغيل ⇒ يُسأل");
 ok(!shouldAskRole({role:"",roleAsked:1},{}),"سُئل ⇒ لا يُسأل");
 ok(!shouldAskRole({role:"qs",roleAsked:0},{}),"له دور ⇒ لا يُسأل");
 ok(!shouldAskRole({role:"",roleAsked:0},{safe:true}),"الوضعُ الآمن ⇒ لا");
 ok(!shouldAskRole({role:"",roleAsked:0},{mobile:true}),"قشرةُ الهاتف ⇒ لا");
 ok(shouldAskRole(null,null),"مدخلٌ ناقص لا يرمي");
});

/* ══ ٢ · معلومات المشروع ══ */
group("الحقولُ الجديدة تُطبَّع والفارغُ يُحذَف",()=>{
 ok(newTitleKeys().includes("logoTxt")&&newTitleKeys().includes("revs"),"المفاتيحُ الجديدة معروفة");
 ok(Object.keys(CODES).includes("sbc")&&SIGS.length===6&&STAMPF.length===3,"الأكوادُ والتواقيعُ والختم");
 const t=normTitleExt({office:"  مكتب\u0007 النخبة ",lic:"",code:"xx",vat:"200",cur:"ر.س",
  sig:{arch:"  أحمد ",bad:"x"},stamp:{},logoShape:"circle",
  revs:[{n:"0",d:"2026-10-01",t:"إصدار أوّل"},{},"x"]});
 eq(t.office,"مكتب  النخبة","محارفُ التحكّم تُزال والفراغُ يُقصّ");
 ok(!("lic" in t),"الفارغُ يُحذَف");
 ok(!("code" in t),"كودٌ مجهول يُحذَف");
 ok(!("vat" in t),"ضريبةٌ فوق ١٠٠ تُحذَف");
 deep(t.sig,{arch:"أحمد"},"التواقيع: المعروفُ وحده");
 ok(!("stamp" in t),"ختمٌ فارغ يُحذَف");
 ok(!("logoShape" in t),"الدائرةُ افتراضٌ فلا تُكتب");
 eq(t.revs.length,1,"المراجعاتُ الفارغة تسقط");
 eq(normTitleExt({vat:"15.125"}).vat,15.13,"الضريبةُ تُقرَّب لخانتين");
 eq(normTitleExt(null),null,"غيرُ الكائن يعود كما هو");
});
group("التجريدُ يُبقي هويّةَ التسليم ويُفرّغ الأشخاص",()=>{
 const o=stripTitleExt({office:"س",lic:"1",sig:{arch:"x"},code:"aci",cur:"$",vat:5,revs:[{n:"1",d:"",t:"a"}]});
 deep(Object.keys(o).sort(),["code","cur","revs","vat"],"الكودُ والعملةُ والضريبةُ والمراجعاتُ فقط");
 deep(stripTitleExt(null),{},"لا شيء ⇒ لا شيء");
});
group("سجلُّ المراجعات: إضافةٌ وحذفٌ بلا مسّ الأصل",()=>{
 const A=[];
 const B=revAdd(A,null,"2026-10-24");
 deep(B,[{n:"0",d:"2026-10-24",t:""}],"الأولى رقمُها ٠ وتاريخُها اليوم");
 const C=revAdd(B,{t:"تعديل الواجهة"},"2026-10-25");
 eq(C[1].n,"1","الرقمُ يتتابع"); eq(C[1].t,"تعديل الواجهة","والوصف");
 eq(A.length,0,"الأصلُ لم يُمسّ");
 let L=[]; for(let i=0;i<20;i++)L=revAdd(L,null,"d");
 eq(L.length,REV_ALL,`السقف ${REV_ALL}`);
 ok(REV_MAX<=REV_ALL,"البلوكُ يعرض جزءاً من السجلّ");
 deep(revDel(C,0).map(r=>r.n),["1"],"الحذفُ بالموضع");
 eq(revDel(C,9).length,2,"موضعٌ خارج المدى ⇒ لا تغيير");
 eq(lastRev({revs:C}).n,"1","آخرُ مراجعة"); eq(lastRev({}),null,"لا مراجعات ⇒ null");
});
group("القراءةُ في كلّ مكان: الكود · العملة · الضريبة · الشعار · التقارير",()=>{
 eq(codeName("sbc"),CODES.sbc,"اسمُ الكود"); eq(codeName(""),"","الفارغُ لا اسمَ له");
 eq(projCurrency({cur:"ج.م"}),"ج.م","عملةُ المشروع"); eq(projCurrency({}),null,"وإلا null");
 eq(projVat({vat:14}),0.14,"الضريبةُ كسر"); eq(projVat({vat:"14"}),null,"نصٌّ ليس ضريبة");
 eq(logoText({logoTxt:"م.ن"}),"م.ن","حروفُ الشعار"); eq(logoText({office:"x"}),"","لا تخمينَ يُرسَم");
 eq(logoShape({logoShape:"hex"}),"hex","الشكل"); eq(logoShape({logoShape:"zz"}),"circle","المجهولُ ⇒ دائرة");
 ok(Object.keys(LOGO_SHAPES).length===4,"أربعةُ أشكال");
 const L=infoLines({proj:"فيلا",owner:"",office:"النخبة",code:"aci",chk:"س"});
 deep(L.map(x=>x[0]),["المشروع","المكتب","الكود المعتمد","التدقيق"],"المملوءُ وحده بالترتيب");
 deep(infoLines(null),[],"لا عنوان ⇒ لا سطور");
});
group("اقتراحُ حروف الشعار من اسم المكتب",()=>{
 eq(monogramOf("مكتب النخبة للاستشارات الهندسية"),"ن","يتخطّى «مكتب» و«ال» التعريف");
 eq(monogramOf("دار الريان الحديثة"),"ر.ح","كلمتان عربيتان ⇒ نقطةٌ بينهما");
 eq(monogramOf("Blue Sky Engineering"),"BS","اللاتينيّة كبيرة بلا فاصل");
 eq(monogramOf(""),"","فارغ ⇒ فارغ");
 ok(monogramOf("a b c d e f").length<=4,"أربعةُ حروفٍ حدٌّ أقصى");
});

/* ══ ٣ · التسعير ══ */
group("التسعيرُ: المشروعُ أوّلاً ثم افتراضُ الجهاز",()=>{
 const was=S.title;
 const dc=P.deviceCurrency(), dt=P.deviceTaxRate();
 ok(typeof dc==="string"&&dc.length>0,`عملةُ الجهاز «${dc}»`);
 ok(dt>=0&&dt<1,`ضريبةُ الجهاز ${dt}`);
 S.title={...(was||{}),cur:"د.إ",vat:5};
 eq(P.currency(),"د.إ","عملةُ المشروع تغلب"); eq(P.taxRate(),0.05,"وضريبتُه");
 eq(P.deviceCurrency(),dc,"وافتراضُ الجهاز لم يتغيّر");
 S.title={...(was||{})}; delete S.title.cur; delete S.title.vat;
 eq(P.currency(),dc,"بلا عملة ⇒ الجهاز"); eq(P.taxRate(),dt,"بلا ضريبة ⇒ الجهاز");
 S.title=was;
});

/* ══ ٤ · الشعار المتّجه ══ */
group("الشعارُ المتّجه بأوّلياتٍ يعرفها كلُّ كاتب",()=>{
 const c=logoPrims(100,50,10,"م.ن","circle");
 ok(c.some(g=>g.t==="arc"&&g.r===10),"الدائرةُ قوس");
 ok(c.some(g=>g.t==="text"),"والحروفُ نصّ");
 ok(c.every(g=>g.sheet===1),"كلُّه على الورقة لا النموذج");
 const h=logoPrims(0,0,10,"AB","hex");
 ok(h.some(g=>g.t!=="arc"&&g.t!=="text"),"السداسيُّ مضلّع");
 ok(!logoPrims(0,0,10,"AB","none").some(g=>g.t==="arc"),"«بلا إطار» ⇒ حروفٌ فقط");
 deep(logoPrims(0,0,10,"",""),[],"بلا حروف ⇒ لا شيء");
 deep(logoPrims(0,0,0,"AB"),[],"نصفُ قطرٍ صفر ⇒ لا شيء");
});

/* ══ ٥ · المشاريع الأخيرة ══ */
const MEM=new Map();
RC.setRecentStore({put:async(k,v)=>{MEM.set(k,JSON.parse(JSON.stringify(v))); return {ok:1}},
 get:async k=>MEM.get(k)||null, del:async k=>{MEM.delete(k)}});
group("المعرّفُ والقائمةُ خالصان",()=>{
 eq(RC.RECENT_K,"civildraft.recent","مفتاحُ الفهرس");
 eq(RC.recentKey("فيلا.json"),RC.recentKey("  فيلا "),"الامتدادُ والفراغُ لا يغيّران المعرّف");
 ok(RC.recentKey("A")===RC.recentKey("a"),"ولا حالةُ الأحرف");
 ok(RC.recentKey("أ")!==RC.recentKey("ب"),"اسمان ⇒ معرّفان");
 const L=RC.recentClean([{id:"bad"},null,{id:RC.recentKey("x"),n:"x",t:5},{id:RC.recentKey("x"),n:"x",t:1}]);
 eq(L.length,1,"الفاسدُ والمكرَّرُ يسقطان");
 let Q=[], drop=[];
 for(let i=0;i<RC.RECENT_MAX+3;i++){const r=RC.recentNote(Q,{id:RC.recentKey("p"+i),n:"p"+i,t:i+1}); Q=r.list; drop=drop.concat(r.dropped)}
 eq(Q.length,RC.RECENT_MAX,`السقف ${RC.RECENT_MAX}`);
 eq(drop.length,3,"والمُسقَطُ يُعاد ليُحذف جسمُه");
 eq(Q[0].n,"p"+(RC.RECENT_MAX+2),"الأحدثُ أوّلاً");
 eq(RC.agoText(0,30e3),"الآن","أقلّ من دقيقة");
 eq(RC.agoText(0,5*60e3),"قبل 5 د","دقائق");
 eq(RC.agoText(0,3*3600e3,true),"3 h ago","بالإنجليزية");
 eq(RC.agoText(0,90*86400e3),"قبل 3 شهر","أشهر");
});
await groupAsync("التسجيلُ والفتحُ والإسقاطُ بمخزنٍ محقون",async()=>{
 localStorage.removeItem(RC.RECENT_K);
 const was=S.walls.slice();
 S.walls.length=0;
 const e=await RC.recentRecord("save","فارغ");
 eq(e.ok,0,"المشروعُ الفارغ لا يُسجَّل");
 S.walls.push({id:"w1",a:[0,0],b:[4000,0],th:200,L:"A-WALL"});
 const r=await RC.recentRecord("save","بيتي.json");
 eq(r.ok,1,"سُجّل");
 eq(RC.recentList().length,1,"في الفهرس"); eq(RC.recentList()[0].n,"بيتي","بلا امتداد");
 ok(MEM.has(r.id),"والنسخةُ في المخزن");
 eq((await RC.recentOpen("r_none_1")).ok,0,"معرّفٌ مجهول ⇒ رفض");
 const d=await RC.recentDrop(r.id);
 eq(d.ok,1,"أُسقط"); eq(RC.recentList().length,0,"وخرج من الفهرس"); ok(!MEM.has(r.id),"وجسمُه حُذف");
 S.walls.length=0; was.forEach(w=>S.walls.push(w));
 RC.setRecentStore(null);
});

/* ══ ٦ · الترجمة والاهتزاز ══ */
group("القاموسُ الإنجليزيّ: مفاتيحُه عربيةٌ وقيمُه لاتينيّة",()=>{
 const K=Object.keys(EN);
 ok(K.length>=300,`${K.length} نصّاً`);
 ok(K.every(k=>/[\u0600-\u06ff]/.test(k)),"كلُّ مفتاحٍ نصٌّ عربيّ");
 ok(K.every(k=>typeof EN[k]==="string"&&EN[k].trim()&&!/[\u0600-\u06ff]/.test(EN[k])),"كلُّ قيمةٍ إنجليزيّةٌ غيرُ فارغة");
 ROLE_IDS.forEach(id=>ok(!!EN[ROLES[id].n],`اسمُ الدور «${ROLES[id].n}» مترجَم`));
});
group("الاهتزازُ قابلٌ للإطفاء",()=>{
 eq(PL.setHapticOn(false),false,"أُطفئ"); eq(PL.hapticOn(),false,"ويُقرأ مُطفأً");
 eq(PL.setHapticOn(1),true,"أُعيد"); eq(PL.hapticOn(),true,"ويُقرأ مُفعَّلاً");
});

/* ══ ٧ · ربطُ أوّل تشغيل ══ */
group("أوّلُ تشغيل: الدورُ في الترحيب، وإلا مركزُ المشروع مرّةً",()=>{
 const wc=src("src/ui/welcome.js"), app=src("src/app.js"), hub=src("src/ui/projhub.js"), css=src("css/welcome.css");
 ok(/data-wcrole/.test(wc)&&/opts\.setRole/.test(wc),"بطاقاتُ الدور في الترحيب تنادي setRole");
 ok(/uiSet\("roleAsked",1\)/.test(wc),"إغلاقُ الترحيب يُثبّت أنّ السؤال عُرض");
 ok(/setRole:id=>setRole\(id,false\)/.test(app),"app.js يمرّر setRole للترحيب");
 ok(/shouldAskRole\(UIS,\{safe:SAFE,mobile:SHELL==="mobile"\}\)/.test(app),"وبلا ترحيب ⇒ shouldAskRole");
 ok(/openHub\("role",\{first:true\}\)/.test(app),"⇒ مركزُ المشروع على «مساحة العمل»");
 ok(/hbFirst/.test(hub)&&/FIRST=!!\(o&&o\.first\)/.test(hub),"والمركزُ يعرض ترحيبَ أوّل تشغيل");
 ok(/\.wc-role\{[^}]*min-block-size:44px/.test(css),"بطاقاتُ الدور ≥ ٤٤ بكسلاً للّمس");
 ok(!/style="/.test(wc.replace(/\/\*[\s\S]*?\*\//g,"")),"لا style مضمَّن (CSP)");
});

summary();
