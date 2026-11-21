/* ═══ التعابير الحسابية · م١أ ═══
   تعبيرٌ في أي حقل رقمي تفاعلي: + - * / ( ) بين أرقام، ولكل رقمٍ
   لاحقةُ وحدةٍ اختيارية. مثال: 3.6+0.15 · (12-0.2)/3 · 4m+150mm.
   بلا eval ولا Function (توافق CSP).

   القاعدة: الرقمُ المجرّد بلا وحدة يأخذ وحدةَ الحقل الافتراضية،
   والعددُ المجرّد يضرب الطولَ أو يُقسَم عليه دون أن تُحوَّل وحدته
   (2*1.2 = 2.4 م). ضربُ طولٍ في طول، أو قسمةُ عددٍ على طول: مرفوض.

   Ex للواجهة التفاعلية حصراً. النواة (core) والذكاء (ai) والملفات
   (io) تستعمل Mx الصارمة، وحارس src/tests/expr.test.js يمنع Ex
   من الوصول إليها. */
import {norm} from "./units.js";
import {LIM} from "./limits.js";

const FACT={mm:1,cm:10,m:1000};
const UNIT_AR={"مم":"mm","سم":"cm","م":"m"};
const UNIT_RE=/(?:mm|cm|مم|سم|m|م)/y;
const NUM_RE=/(?:\d+(?:\.\d+)?|\.\d+)/y;
/* م١ب: DMS */
const DMS_RE=/[d°](?:(\d+(?:\.\d+)?)['′’])?(?:(\d+(?:\.\d+)?)["″”])?/y;

class ExprError extends Error{}

function tokenize(src,ang){
 const T=[]; let i=0;
 while(i<src.length){
  const ch=src[i];
  if("+-*/()".includes(ch)){T.push({t:ch,p:i});i++;continue}
  if(/\s/.test(ch)){i++;continue}
  if(/[\d.]/.test(ch)){
   const p=i;
   NUM_RE.lastIndex=i;
   const m=NUM_RE.exec(src);
   if(!m)throw new ExprError(`«${ch}» غير متوقع`);
   i=NUM_RE.lastIndex;
   let u=null, v=parseFloat(m[0]);
   if(ang){
    DMS_RE.lastIndex=i;
    const d=DMS_RE.exec(src);
    if(d){
     const mi=+(d[1]||0), se=+(d[2]||0);
     if(mi>=60||se>=60)throw new ExprError("الدقائق والثواني أقل من 60");
     v+=mi/60+se/3600; i=DMS_RE.lastIndex;
    }
    T.push({t:"num",v,u,p}); continue;
   }
   UNIT_RE.lastIndex=i;
   const um=UNIT_RE.exec(src);
   if(um){u=UNIT_AR[um[0]]||um[0];i=UNIT_RE.lastIndex}
   T.push({t:"num",v,u,p});
   continue;
  }
  throw new ExprError(`«${ch}» غير متوقع`);
 }
 return T;
}

/* يعيد الطول بالمليمتر الصحيح، أو يرمي ExprError برسالة تصلح للعرض */
function evalExpr(src,def="m"){
 const ang=def==="deg", dflt=ang?1:FACT[UNIT_AR[def]||def];
 if(!dflt)throw new ExprError(`وحدة افتراضية غير معروفة`);
 const T=tokenize(src,ang);
 let k=0;
 const peek=()=>T[k];
 const end=()=>{if(k>=T.length)throw new ExprError("تعبير غير مكتمل")};
 const toMM=x=>x.k==="len"?x.v:x.v*dflt;

 function primary(){
  end();
  const t=T[k];
  if(t.t==="num"){
   k++;
   return t.u?{k:"len",v:t.v*FACT[t.u]}:{k:"num",v:t.v};
  }
  if(t.t==="("){
   k++;
   const r=additive();
   if(!peek()||peek().t!==")")throw new ExprError("أقواس غير متوازنة");
   k++;
   return r;
  }
  throw new ExprError(`«${t.t}» في غير موضعه`);
 }
 function unary(){
  end();
  if(T[k].t==="-"){k++; const x=unary(); return {k:x.k,v:-x.v}}
  if(T[k].t==="+"){k++; return unary()}
  return primary();
 }
 function term(){
  let a=unary();
  while(peek()&&(peek().t==="*"||peek().t==="/")){
   const op=T[k++].t;
   const b=unary();
   if(op==="*"){
    if(a.k==="len"&&b.k==="len")throw new ExprError("لا يُضرب طولٌ في طول");
    a={k:(a.k==="len"||b.k==="len")?"len":"num",v:a.v*b.v};
   }else{
    if(b.v===0)throw new ExprError("قسمة على صفر");
    if(a.k==="num"&&b.k==="len")throw new ExprError("لا يُقسَم عدد على طول");
    a={k:(a.k==="len"&&b.k==="num")?"len":"num",v:a.v/b.v};
   }
  }
  return a;
 }
 function additive(){
  let a=term();
  while(peek()&&(peek().t==="+"||peek().t==="-")){
   const op=T[k++].t;
   const b=term();
   if(a.k==="num"&&b.k==="num")a={k:"num",v:op==="+"?a.v+b.v:a.v-b.v};
   else{
    const x=toMM(a), y=toMM(b);
    a={k:"len",v:op==="+"?x+y:x-y};
   }
  }
  return a;
 }
 const r=additive();
 if(k<T.length)throw new ExprError(`«${T[k].t}» في غير موضعه`);
 const f=toMM(r);
 if(!isFinite(f))throw new ExprError("نتيجة غير صالحة");
 return f;
}

/* تفصيلٌ للواجهة: {mm,f} أو {err} برسالةٍ عربية */
export function exParse(v,def="m"){
 if(v==null)return {err:"فارغ"};
 const s=norm(String(v)).replace(/\s+/g,"").replace(/,/g,".");
 if(!s)return {err:"فارغ"};
 try{
  const f=evalExpr(s,def), mm=Math.round(f);
  if(Math.abs(mm)>LIM.coord.max)return {err:"خارج الحدّ المسموح"};
  return {mm,f};
 }catch(e){
  if(e instanceof ExprError)return {err:e.message};
  throw e;
 }
}

/* زاويةٌ بالدرجات: {a} أو {err} */
export function exAng(v){
 const s=norm(String(v==null?"":v)).replace(/\s+/g,"");
 if(!s)return {err:"فارغ"};
 try{return {a:evalExpr(s,"deg")}}
 catch(e){if(e instanceof ExprError)return {err:e.message}; throw e}
}

/* الاسم المختصر للواجهة: مليمتر أو null. لا يرمي أبداً */
export function Ex(v,def="m"){
 const r=exParse(v,def);
 return r.mm==null?null:r.mm;
}

/* معاينة الحقل قبل Enter (core/exq.js#exHint): «= 3.750 م» أو سبب الرفض */
export function exHint(v,ang){
 const r=ang?exAng(v):exParse(v);
 if(r.err)return {t:r.err,bad:1};
 return {t:"= "+(ang?+r.a.toFixed(4)+"°":(r.f/1000).toFixed(3)+" م")};
}
