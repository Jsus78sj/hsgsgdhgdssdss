/* ═══ أدوات الفتحات ═══
   النقر يختار الجدار، والموضع من نقرتك أو من حقل «عند».
   لا تقليم صامت: ما لا يتّسع يُرفَض برسالة تذكر المدى المتاح. */
import {S} from "../core/state.js";
import {m2,m3,M,dim2} from "../core/units.js";
import {wallById,wallLen,wallAt,dir,isArc} from "../core/walls.js";
import {addOpen,sAt,openPt,openById,allowed,saySpans,okName,OK} from "../core/opens.js";
import {defTool,H,T,rec,ov,ovLen,ovNum,setOpt,pvLine,pvBand,pvText} from "./registry.js";

const GRN="#5cd98e", RED="#ff6f6f";

/* تقاطعاتُ محاور الجدران المستقيمة على مسار الجدار المضيف. */
function crosses(w){
 const d=dir(w);if(!d||isArc(w))return [];
 const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],out=[];
 S.walls.forEach(x=>{
  if(x===w||isArc(x)||(+x.level||0)!==(+w.level||0))return;
  const e=dir(x);if(!e)return;
  const den=cross([d.ux,d.uy],[e.ux,e.uy]);
  if(Math.abs(den)<0.05)return;
  const q=[x.a[0]-w.a[0],x.a[1]-w.a[1]];
  const t=cross(q,[e.ux,e.uy])/den,u=cross(q,[d.ux,d.uy])/den;
  if(t< -x.t/2-5||t>d.L+x.t/2+5||u< -w.t/2-5||u>e.L+w.t/2+5)return;
  out.push({s:Math.max(0,Math.min(d.L,t)),w:x});
 });
 out.sort((a,b)=>a.s-b.s);
 return out;
}
/* «عند» يقيس من مركز المسار افتراضياً، أو من وجه جدار قائم إلى
   حافة الفتحة عند ref=jamb. والفراغ يُبقي إسقاط النقرة كما كان. */
function sOf(w,p,tid){
 const raw=String(ov(tid,"at")||"").trim();
 const L=wallLen(w);
 if(!raw)return sAt(w,p);
 const ref=ov(tid,"ref")||"center",from=ov(tid,"from")==="b"?"b":"a";
 if(/^cc$/i.test(raw)){
  const C=crosses(w);
  if(C.length<2)throw new Error("at=cc يحتاج جدارين متقاطعين يحدّدان المقطع الصافي");
  const at=sAt(w,p);
  let i=C.findIndex((x,n)=>n+1<C.length&&at>=x.s&&at<=C[n+1].s);
  if(i<0)i=from==="b"?C.length-2:0;
  const lo=C[i].s+C[i].w.t/2,hi=C[i+1].s-C[i+1].w.t/2;
  if(hi<=lo)throw new Error("المقطع الصافي بين الجدارين غير موجب");
  const Wd=ovLen(tid,"w")||0;
  if(Wd&&hi-lo<Wd)throw new Error(`المقطع الصافي ${m3(hi-lo)} م أقل من عرض ${tid==="door"?"الباب":tid==="win"?"الشباك":"الفتحة"} ${m3(Wd)} م`);
  return Math.round((lo+hi)/2);
 }
 if(/^(c|م|وسط)$/i.test(raw))return Math.round(L/2);
 const pc=/^(\d*\.?\d+)%$/.exec(raw);
 if(pc)return Math.round(L*parseFloat(pc[1])/100);
 const v=M(raw);
 if(ref!=="jamb")return from==="b"?(L-v):v;
 const C=crosses(w),near=from==="b"?C[C.length-1]:C[0];
 const face=near?(from==="b"?near.s-near.w.t/2:near.s+near.w.t/2)
  :(from==="b"?L:0);
 const edge=v+(ovLen(tid,"w")||0)/2;
 return Math.round(from==="b"?face-v-edge:face+edge);
}
/* swing=cursor: جهةُ الفتح من جانب المؤشر الخام عن مسار الجدار */
function swingOf(w,p,tid){
 const v=ov(tid,"swing");
 if(v!=="cursor")return v;
 const d=dir(w),q=T.hover||p;
 return d&&(d.nx*(q[0]-w.a[0])+d.ny*(q[1]-w.a[1]))<0?"right":"left";
}
function place(ctx,hit,p,tid,kind){
 const w=wallById(hit.id);
 if(!w)throw new Error("انقر على جدار");
 const W=ovLen(tid,"w"), Hh=ovLen(tid,"h"), sl=ovLen(tid,"sill");
 const s=sOf(w,p,tid);
 const ex={hinge:ov(tid,"hinge"),swing:swingOf(w,p,tid)};
 if(OK[kind].pan)ex.pan=Math.round(ovNum(tid,"pan"))||1;
 if(kind==="niche"){
  ex.dep=ovLen(tid,"dep");
  ex.face=ov(tid,"face");
 }
 const o=addOpen(w,s,kind,W,Hh,sl,ex);
 rec(ctx,o,"opens");
 H.rep("ok",`${o.id} ${okName(kind)} ${dim2(m2(o.w),m2(o.h))} م `
  +`على ${w.id} عند ${m2(o.s)} م`
  +(o.sill?` · جلسة ${m2(o.sill)} م`:"")
  +(o.dep!=null?` · عمق ${m2(o.dep)} م`:""));
 return o;
}
/* ═══ ترتيبُ الحقولِ هو ما يظهر ═══ المرحلة ٦: الثلاثةُ الأولى ظاهرةٌ
   والباقي وراءَ «المزيد». وأمرُ العرضِ والارتفاعِ محسومٌ: لا فتحةَ بلا
   مقاسٍ يُكتَب. والثالثُ يختلف بنوعِ الفتحةِ، فلا يصلح أن يكون
   «الجلسةَ» للجميعِ: جلسةُ الباب **صفرٌ بتعريفه** فحقلٌ لا يُلمَس أبداً
   يأكل أحدَ المواضعِ الثلاثةِ الغالية. فمن أراد ترقيةَ حقلٍ من إضافاتِه
   إلى الظاهرِ أعلنه في `promote` — وهو ترقيةٌ **في ترتيبِ الأداةِ
   نفسِها** لا جدولٌ ثانٍ ينجرف عنها. */
function mk(id,alias,label,kind,dw,dh,ds,extra,promote){
 const ex=(extra||[]).slice();
 const up=(promote||[]).map(k=>{
  const i=ex.findIndex(f=>f.k===k);
  /* مفتاحٌ مرقّىٌ غيرُ موجودٍ خطأُ برمجةٍ لا خيارُ مستخدمٍ: يُعلَن
     صراحةً لا يُهمَل صامتاً فيختفي حقلٌ ولا يدري أحد. */
  if(i<0)throw new Error(`promote: ${id} لا حقلَ ${k}`);
  return ex.splice(i,1)[0];
 });
 const opts=[
  {k:"w",   label:"العرض م",   type:"len", def:dw},
  {k:"h",   label:"الارتفاع م",type:"len", def:dh}
 ].concat(up,[
  {k:"sill",label:"الجلسة م",  type:"len", def:ds},
  {k:"at",  label:"عند م",     type:"text", def:"",
   hint:"فارغ = من النقر · c = المنتصف · cc = منتصف الصافي · أو طول"},
  {k:"from",label:"من",        type:"sel",
   items:[["a","بداية الجدار"],["b","نهايته"]], def:"a"},
  {k:"ref",label:"مرجع المسافة",type:"sel",
   items:[["center","مركز المسار"],["jamb","وجه قائم/حافة الفتحة"]],def:"center"}
 ],ex);
 const flip=(k,values)=>{
  const cur=ov("door",k);
  const next=cur===values[0]?values[1]:values[0];
  setOpt("door",k,next);
  H.rep("in",`${k==="swing"?"جهة الفتح":"المفصّلة"}: ${next==="left"?"يسار":next==="right"?"يمين":next==="start"?"البداية":"النهاية"}`);
  H.prompt();H.draw();
 };
 const stepOpts=id==="door"?{
  f:{n:"جهة",g:"⇅",touch:"جهة",run(){flip("swing",["left","right"])}},
  ف:{n:"جهة",run(){flip("swing",["left","right"])}},
  b:{n:"مفصّلة",g:"⇆",touch:"مفصّلة",run(){flip("hinge",["start","end"])}},
  ب:{n:"مفصّلة",run(){flip("hinge",["start","end"])}}
 }:{};
 defTool({
  id, alias, label,
  hint:"انقر على جدار — الموضع من نقرتك أو من حقل «عند»",
  opts,
  steps:[{p:"انقر موضع الفتحة على جدار (أو اكتب W7@2.4)",opts:stepOpts,
   ent:"wall", entName:"جدار", loop:1,
   entVia:{open:h=>{
    const o=openById(h.id);
    return o?{k:"wall",id:o.wall}:null;
   }},
   each(ctx,hit,p){
    place(ctx,hit,p,id,
     (id==="door")?(ov("door","kind")||"door"):kind);
   }}],
  prev(ctx,g){
   if(!g)return [];
   /* الجدار الذي ستلتقطه النقرة نفسه (من المؤشّر الخام وبنوعه وحده)،
      فيتّفق المُبرَز والنتيجة؛ وإلا الأقرب إلى النقطة الملتقَطة */
   let w=null;
   const hv=T.hover;
   if(hv){
    const h=H.hit(hv[0],hv[1],["open","wall"]);
    if(h){
     const o=(h.k==="open")?openById(h.id):null;
     w=wallById(o?o.wall:h.id);
    }
   }
   if(!w)w=wallAt(g[0],g[1],250);
   if(!w)return [];
   const d=dir(w);
   if(!d)return [];
   const W=ovLen(id,"w")||900;
   const s=Math.round(sOf(w,g,id));
   const A=allowed(w,W,null);
   const ok=A.fits&&A.spans.some(([a,b])=>s>=a&&s<=b);
   const P=t=>[Math.round(w.a[0]+d.ux*t),
               Math.round(w.a[1]+d.uy*t)];
   /* أبعادٌ مؤقتة من حافّتي الفتحة إلى أقرب وجهٍ عابر أو طرف الجدار */
   const Lw=wallLen(w),C=crosses(w),e0=s-W/2,e1=s+W/2;
   const lf=Math.max(0,...C.map(x=>x.s+x.w.t/2).filter(f=>f<=e0+1)),
         rf=Math.min(Lw,...C.map(x=>x.s-x.w.t/2).filter(f=>f>=e1-1));
   const off=t=>{const q=openPt(w,t);return [q[0]+d.nx*(w.t/2+250),q[1]+d.ny*(w.t/2+250)]};
   const tmp=[];
   if(e0-lf>1)tmp.push(pvLine(off(lf),off(e0),"#9ad"),pvText(off((lf+e0)/2),m3(e0-lf),"#9ad"));
   if(rf-e1>1)tmp.push(pvLine(off(e1),off(rf),"#9ad"),pvText(off((e1+rf)/2),m3(rf-e1),"#9ad"));
   return tmp.concat([
    pvLine(w.a,P(s),"#ffd06b"),
    pvBand(openPt(w,s-W/2),openPt(w,s+W/2),w.t,ok?GRN:RED),
    pvText(openPt(w,s),`${w.id} · ${m3(s)} م`
     +(id==="door"?` · ${swingOf(w,g,"door")==="right"?"↶ يمين":"↷ يسار"}`:"")
     +(ok?"":` ✗ الحرّ ${saySpans(A)}`), ok?GRN:RED)]);
  }});
}
mk("door","d باب","باب","door","0.9","2.1","0",[
 {k:"kind", label:"النوع",   type:"sel", seg:1,
  items:[["door","مفرد"],["double","مزدوج"],["sliding","سحب"]],
  def:"door"},
 {k:"hinge",label:"المفصّلة",type:"sel",
  items:[["start","البداية"],["end","النهاية"]],def:"start"},
 {k:"swing",label:"جهة الفتح",type:"sel",
  items:[["left","يسار المسار"],["right","يمينه"],["cursor","جهة المؤشر"]],def:"left"}],
 /* نوعُ البابِ يتغيّر أكثرَ من جلستِه — وجلستُه صفرٌ دائماً */
 ["kind"]);

mk("win","n window شباك نافذه","شباك","window","1.5","1.4","0.9",[
 {k:"pan",label:"المصاريع",type:"num",def:1}]);

mk("fixed","ثابت زجاج","شباك ثابت","fixed","1.2","1.4","0.9",[
 {k:"pan",label:"المصاريع",type:"num",def:1}]);

mk("opening","op فتحه","فتحة صافية","opening","2","2.1","0");
mk("arch","قنطره","فتحة مقنطرة","arch","1.2","2.2","0");
mk("niche","كوه حنيه","كوّة","niche","0.6","1.2","0.9",[
 {k:"dep", label:"العمق م",type:"len",def:"0.10",   /* كان 0.12: لا يتّسع له الجدارُ الافتراضيّ 0.15 (الأقصى 0.11) */
  hint:"الأقصى = سماكة الجدار − 4 سم"},
 {k:"face",label:"الوجه",  type:"sel",
  items:[["l","يسار المسار"],["r","يمينه"]],def:"l"}],
 /* العمقُ هو ما يُميِّز الكوّةَ عن الفتحةِ — لا يُخفى */
 ["dep"]);
