/* ═══ معلوماتُ المشروع ═══ المرحلة ٢ من خطّة التطوير
   مصدرٌ واحدٌ يُقرأ في كلّ مكان: بلوك العنوان والتقارير والتسعير.
   تسكن في S.title نفسِه (لا مفتاحٌ جديدٌ في المشروع) فتمرّ بالحفظ
   والتاريخ والتراجع وبـ«تسليمٌ بلا بيانات المحرّر» كسائر حقوله.

   الحقولُ القديمة (proj · owner · loc · sheet · rev · by) لا تتغيّر.
   والجديدة كلّها فارغةٌ افتراضاً، والفارغُ لا يُرسَم ولا يُغيّر مخرَجاً:
   مشروعٌ قديمٌ يُصدَّر حرفاً بحرفٍ كما كان. */

/* الأكوادُ المعتمدة — الاسمُ المطبوع على الورقة والتقارير.
   (v2.9.1) كودُ التصميم في المشروع واحدٌ: BS 8110 — تقرؤه الحاسباتُ اليوم
   والتصميمُ الإنشائيّ في المرحلة ٤. وبقية الأكواد تبقى «تسميةً» للعنوان
   فقط حتى لا يفقد مشروعٌ محفوظٌ قيمتَه (يُحذَف ما ليس في القائمة عند التطبيع)،
   ولا تغيّر حسابَ شيء. التلميحُ الظاهر في القائمة في CODE_NOTE أدناه، وهو
   لا يُطبَع: فالاسمُ هنا هو الذي يخرج في بلوك العنوان وinfoLines. */
export const CODES={
 "":"—",
 bs8110:"BS 8110 (البريطاني)",
 aci:"ACI 318",
 sbc:"SBC 304 (الكود السعودي)",
 ecp:"ECP 203 (الكود المصري)",
 bs:"BS / Eurocode"};
/* كودُ التصميم الوحيد الذي تُحسَب به الحاسباتُ والتصميمُ الإنشائيّ */
export const DESIGN_CODE="bs8110";
/* تلميحُ القائمة (لا يُطبَع). الفارغُ = الافتراضيّ = BS 8110 بلا طباعة،
   فالمشروعُ القديم يُصدَّر حرفاً بحرفٍ كما كان. */
export const CODE_NOTE={
 "":"الافتراضيّ: BS 8110 — لا يُطبَع على الورقة",
 bs8110:"يُطبَع على الورقة والتقارير",
 aci:"قديم · تسميةٌ فقط — الحساب بـ BS 8110",
 sbc:"قديم · تسميةٌ فقط — الحساب بـ BS 8110",
 ecp:"قديم · تسميةٌ فقط — الحساب بـ BS 8110",
 bs:"قديم · تسميةٌ فقط — الحساب بـ BS 8110"};
/* خاناتُ التواقيع بترتيب الشريط الجانبي (أزواجٌ: يمين · يسار) */
export const SIGS=[["arch","معماري"],["elec","كهرباء"],["str","إنشائي"],
 ["tel","اتصالات"],["san","صحي"],["hvac","تكييف"]];
export const REV_MAX=4;          /* صفوفُ سجلّ المراجعات في البلوك */

const str=(v,n)=>String(v==null?"":v).replace(/[\u0000-\u001f]/g," ").slice(0,n);
const plain=o=>!!o&&typeof o==="object"&&!Array.isArray(o);

/* الحقولُ النصّيةُ الجديدة وحدودُها */
const TXT={office:60,lic:30,chk:30,apr:30,cur:8,phone:30,logoTxt:4};
export const newTitleKeys=()=>Object.keys(TXT).concat(["code","vat","sig","stamp","revs","logoShape"]);
/* شعارُ المكتب (v2.6.0) — **متّجهٌ لا صورة**: حروفٌ (حتى ٤) داخل شكلٍ
   يُرسَم بالأوّليات نفسِها (قوس · مضلّع · نصّ) فيخرج في DXF وPDF وSVG
   وPNG حرفاً بحرفٍ بلا مسارِ صورٍ ثانٍ في كلّ كاتب. */
export const LOGO_SHAPES={circle:"دائرة",square:"مربّع",hex:"سداسي",none:"بلا إطار"};
export const STAMPF=[["name","الاسم"],["reg","رقم القيد"],["no","رقم الختم"]];
/* اقتراحُ حروف الشعار من اسم المكتب: أوّلُ حرفٍ من أوّل كلمتين ذاتَي معنى */
const STOP=new Set(["مكتب","شركة","مؤسسة","مؤسّسة","دار","للاستشارات","الاستشارات","الهندسية","الهندسيّة","للهندسة","office","company","co","the","and","of"]);
export function monogramOf(office){
 const W=String(office||"").replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(Boolean);
 const pick=W.filter(w=>!STOP.has(w.toLowerCase()));
 const src=(pick.length?pick:W).slice(0,2);
 const ch=w=>{const s=w.replace(/^ال(?=\p{L}{2})/u,""); return s.charAt(0)};
 return src.map(ch).join(src.length>1&&/[\u0600-\u06ff]/.test(src.join(""))?".":"").toUpperCase().slice(0,4);
}

/* يُطبّع الحقولَ الجديدة في كائن عنوانٍ قائم (يُنادى من ensureShape).
   لا يمسّ القديمة — تطبيعُها في state.js كما كان. */
export function normTitleExt(t){
 if(!plain(t))return t;
 Object.keys(TXT).forEach(k=>{
  if(t[k]===undefined)return;
  t[k]=str(t[k],TXT[k]).trim();
  if(!t[k])delete t[k];
 });
 if(t.code!==undefined){if(!CODES[t.code]||!t.code)delete t.code}
 if(t.logoShape!==undefined){if(!LOGO_SHAPES[t.logoShape]||t.logoShape==="circle")delete t.logoShape}
 if(t.vat!==undefined){
  const v=+t.vat;
  if(t.vat===""||t.vat===null||!isFinite(v)||v<0||v>100)delete t.vat;
  else t.vat=Math.round(v*100)/100;
 }
 if(t.sig!==undefined){
  const o={};
  if(plain(t.sig))SIGS.forEach(([k])=>{const v=str(t.sig[k],30).trim(); if(v)o[k]=v});
  if(Object.keys(o).length)t.sig=o; else delete t.sig;
 }
 if(t.stamp!==undefined){
  const o={};
  if(plain(t.stamp))["name","reg","no"].forEach(k=>{const v=str(t.stamp[k],30).trim(); if(v)o[k]=v});
  if(Object.keys(o).length)t.stamp=o; else delete t.stamp;
 }
 if(t.revs!==undefined){
  const L=(Array.isArray(t.revs)?t.revs:[]).filter(plain).slice(0,12)
   .map(r=>({n:str(r.n,6).trim(),d:str(r.d,12).trim(),t:str(r.t,60).trim()}))
   .filter(r=>r.n||r.d||r.t);
  if(L.length)t.revs=L; else delete t.revs;
 }
 return t;
}
/* التجريد: يُفرَّغ كلُّ ما يدلّ على شخصٍ أو جهة، ويبقى ما هو هويّةُ التسليم
   (الكود والعملة والضريبة وسجلّ المراجعات). */
export function stripTitleExt(t,out){
 const o=out||{};
 if(!plain(t))return o;
 if(t.code)o.code=t.code;
 if(t.cur)o.cur=t.cur;
 if(t.vat!==undefined)o.vat=t.vat;
 if(Array.isArray(t.revs))o.revs=t.revs.map(r=>({...r}));
 return o;
}
/* ═══ سجلُّ المراجعات من مركز المشروع ═══ خالصان: يُعيدان مصفوفةً جديدة
   ولا يمسّان الأصل، والمُنادي يكتبها داخل edit() فتصير خطوةَ تراجع. */
export const REV_ALL=12;
export function revAdd(revs,r,today){
 const L=(Array.isArray(revs)?revs:[]).map(x=>({...x}));
 const last=L.length?L[L.length-1]:null;
 const nextN=last&&/^\d+$/.test(last.n)?String(+last.n+1):(last?"":"0");
 const row={n:str((r&&r.n)||nextN||String(L.length),6).trim(),
  d:str((r&&r.d)||today||"",12).trim(),t:str(r&&r.t,60).trim()};
 L.push(row);
 return L.slice(-REV_ALL);
}
export function revDel(revs,i){
 const L=(Array.isArray(revs)?revs:[]).map(x=>({...x}));
 if(i>=0&&i<L.length)L.splice(i,1);
 return L;
}
/* ═══ القراءةُ في كلّ مكان ═══ */
export const codeName=c=>CODES[c]&&c?CODES[c]:"";
/* هل كودُ المشروع المسجَّل غيرُ كودِ التصميم؟ الفارغُ ليس تناقضاً (= BS 8110) */
export const codeConflict=c=>!!c&&!!CODES[c]&&c!==DESIGN_CODE;
/* تنبيهُ التناقض للّوحات: يُقال صراحةً أن الحسابَ بـ BS 8110 مهما سُجِّل */
export const conflictNote=c=>codeConflict(c)
 ?`كود المشروع المسجَّل في معلومات المشروع «${CODES[c]}» تسميةٌ فقط؛ الحاسباتُ والتصميمُ الإنشائيّ تعتمد BS 8110 وحده — فسِّر النتائج على هذا الأساس`
 :"";
/* العملةُ والضريبةُ: المشروعُ إن ضبطهما، وإلا null (يعود المُنادي لافتراضه) */
export const projCurrency=t=>(plain(t)&&t.cur)?t.cur:null;
export const projVat=t=>(plain(t)&&typeof t.vat==="number"&&isFinite(t.vat))?t.vat/100:null;
/* آخرُ مراجعةٍ مسجَّلة — تُعرَض رقماً في البلوك إن لم يُكتَب t.rev */
/* حروفُ الشعار الفعليّة: المكتوبةُ صراحةً، وإلا لا شعار (لا تخمينَ يُرسَم) */
export const logoText=t=>(plain(t)&&t.logoTxt)?t.logoTxt:"";
export const logoShape=t=>(plain(t)&&LOGO_SHAPES[t.logoShape])?t.logoShape:"circle";
export const lastRev=t=>{
 const L=plain(t)&&Array.isArray(t.revs)?t.revs:[];
 return L.length?L[L.length-1]:null;
};
/* سطورُ «معلومات المشروع» للتقارير — المملوءُ وحده، بالترتيب */
export function infoLines(t){
 if(!plain(t))return [];
 const L=[];
 const add=(n,v)=>{if(v)L.push([n,String(v)])};
 add("المشروع",t.proj); add("المالك",t.owner); add("الموقع",t.loc);
 add("المكتب",t.office); add("رقم الرخصة",t.lic); add("الكود المعتمد",codeName(t.code));
 add("المصمّم",t.by); add("التدقيق",t.chk); add("الاعتماد",t.apr);
 return L;
}
