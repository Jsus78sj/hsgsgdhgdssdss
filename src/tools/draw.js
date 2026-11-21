/* ═══ أدوات الرسم ═══
   كل أداة تُنشئ ما طلبتَه بالحرف: جدار واحد بسماكته ومحاذاته،
   ولا لحم ولا كائن مشتقّ ولا تعديل على ما سبق. */
import {edit,S} from "../core/state.js";
import {m2,m3,mm,dm2,D2R,R2D,deg,norm,Nx,ltr} from "../core/units.js";
import {Ex,exAng} from "../core/exq.js";
import {addWall,ALIGN,dir,wallLen,bulgeFrom3,arcParams,band,
        arcTess} from "../core/walls.js";
import {addPline,plineLen,delPline,plineById} from "../core/plines.js";
import {addDim,addDimAng} from "../core/dims.js";
import {addSlab,addFooting} from "../core/struct.js";
import {WELD} from "../core/geom.js";
import {defTool,H,T,TOOLS,rec,finish,endChain,undoStep,ov,ovLen,ovOn,setOpt,
        feedPoint,feedText,nextStep,pvLine,pvRect,pvBand,pvPoly,pvText} from "./registry.js";

const GRN="#5cd98e", YEL="#ffd06b", PNK="#ff8f8f";
const TY=[["int","داخلي"],["ext","خارجي"],["low","سترة"]];
const AL=[["c","مركزي"],["l","الوجه الأيسر"],["r","الوجه الأيمن"]];
const cycleAlign=tid=>{
 const cur=ov(tid,"align")||"c", next=({c:"l",l:"r",r:"c"})[cur]||"c";
 setOpt(tid,"align",next);
 H.rep("in",`محاذاة: ${{c:"مركزي",l:"يسار",r:"يمين"}[next]}`);
 H.prompt(); H.draw(); return next;
};
const parseLength=s=>Ex(String(s||"").trim());
const parseAngle=s=>{
 const r=exAng(s); if(r&&r.a!=null)return r.a;
 throw new Error(`زاوية غير صالحة: ${s}`+(r&&r.err?` · ${r.err}`:""));
};
const dist=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
const lineBasis=(a,b)=>{
 const L=dist(a,b); if(L<1)throw new Error("الضلع أقصر من 1 مم");
 return {L,ux:(b[0]-a[0])/L,uy:(b[1]-a[1])/L};
};
const rotPt=(o,x,y,a)=>[Math.round(o[0]+x*Math.cos(a)-y*Math.sin(a)),
 Math.round(o[1]+x*Math.sin(a)+y*Math.cos(a))];

/* ═══ جدار ═══ */
function mkWall(ctx,a,b){
 const w=addWall(a,b,
  ovLen("wall","t"), ov("wall","type"), ov("wall","align"),
  ovLen("wall","h"));
 rec(ctx,w,"walls");
 const d=dir(w);
 H.rep("ok",`${w.id} · ${m2(wallLen(w))} م · `
  +`${d?d.ang.toFixed(1):"0"}° · ${mm(w.t).toFixed(2)} م `
  +`${ALIGN[w.align]}`
  +(w.type==="low"?` · سترة ${m2(w.h)} م`:""));
 return w;
}
defTool({
 id:"wall", alias:"w جدار خط", label:"جدار",
 hint:"نقطتان لكل جدار · C يغلق · Enter ينهي السلسلة · Esc يخرج · U يتراجع",
 opts:[
  {k:"t",    label:"السماكة م", type:"len", def:"0.15"},
  {k:"type", label:"النوع",     type:"sel", seg:1, items:TY, def:"int"},
  {k:"align",label:"المسار على",type:"sel", items:AL, def:"c",
   hint:"يسار ويمين بالنسبة لاتجاه الرسم"},
  {k:"h",    label:"ارتفاع السترة م", type:"len", def:"1",
   when:o=>o.type==="low"},
  {k:"chain",label:"متّصل",     type:"chk", def:1}],
 steps:[
  {p:"نقطة البداية"},
  {p:"النقطة التالية", loop:1, base:-1, chainRestart:1,
   inputText(ctx,s){
    if(!/[;؛]/.test(s))return false;
    const parts=s.split(/[;؛]/).map(x=>x.trim());
    if(parts.some(x=>!x))throw new Error("السلسلة تحتوي جزءاً فارغاً");
    const AR=n=>String(n).replace(/\d/g,d=>"٠١٢٣٤٥٦٧٨٩"[d]);
    const done=n=>n===0?"لم يُرسم شيء":n===1?"رُسم جزء واحد":n===2?"رُسم جزءان":`رُسمت ${AR(n)} أجزاء`;
    for(let i=0;i<parts.length;i++){
     const c=parts[i];
     if(/^(c|close|اغلاق)$/i.test(c)&&i<parts.length-1)
      throw new Error(`الجزء ${AR(i+1)}: «${c}» — الإغلاق يجب أن يكون آخر جزء — ${done(i)}`);
     let why="لم يُقبل";
     feedText.strict=1;
     try{if(feedText(c))continue}
     catch(e){why=e.message}
     finally{feedText.strict=0}
     if(/<{1,2}\s*$/.test(c))why="زاوية ناقصة";
     throw new Error(`الجزء ${AR(i+1)}: «${c}» ${why} — ${done(i)} (يُزال بـU)`);
    }
    return true;
   },
   opts:{
    c:{n:"إغلاق",run(ctx){
     if(ctx.pts.length<3)throw new Error("الإغلاق يحتاج ثلاث نقاط");
     const last=ctx.pts[ctx.pts.length-1],first=ctx.pts[0];
     if(dist(last,first)>1)mkWall(ctx,last,first);
     H.rep("ok","أُغلق المضلع — ابدأ سلسلة جديدة أو Esc للخروج");
     endChain();
    }},
    u:{n:"تراجع",run(){undoStep()}},
    f:{n:"محاذاة",g:"⇆",touch:"محاذاة",run(){cycleAlign("wall")}},
    ف:{n:"محاذاة",run(){cycleAlign("wall")}}},
   each(ctx,p){
    const P=ctx.pts;
    if(P.length<2)return;
    mkWall(ctx,P[P.length-2],p);
    /* غير المتّصل: كل جدار مستقلّ بنقطتيه */
    if(!ovOn("wall","chain")){
     ctx.pts.length=0;
     ctx.pts.push(p);
    }
   }}],
 prev(ctx,g){
  const o=[], P=ctx.pts, t=ovLen("wall","t")||150;
  for(let i=0;i<P.length-1;i++)o.push(pvLine(P[i],P[i+1],"#4b5a6b"));
  if(P.length&&g){
   const w={a:P[P.length-1],b:g,t,align:ov("wall","align")||"c"};
   const poly=band(w); if(poly)o.push(pvPoly(poly,GRN,1));
   o.push(pvLine(P[P.length-1],g,YEL));
   const a=ov("wall","align")||"c";
   o.push(pvText([g[0]+450,g[1]+450],`محاذاة: ${{c:"مركزي",l:"يسار",r:"يمين"}[a]}`,YEL));
  }
  return o;
 }});

/* ═══ الجدار القوسي ═══
   المسار القديم (3p) باقٍ افتراضياً؛ أو نصف قطر، مركز، أو استمرارٌ
   مماسّي من آخر جدار. كلّها تُخزَّن bulge كما في DXF. */
function radiusBulge(a,b,r,side){
 const c=dist(a,b), R=Math.abs(+r);
 if(!isFinite(R)||R<1)throw new Error("نصف القطر غير صالح");
 if(R<c/2-0.5)throw new Error(`نصف القطر ${m2(R)} م أصغر من نصف الوتر ${m2(c/2)} م — الأدنى ${m2(c/2)} م`);
 const minor=2*Math.asin(Math.min(1,c/(2*R)));
 const sw=(side<0?-1:1)*(r<0?2*Math.PI-minor:minor);
 return Math.tan(sw/4);
}
function tangentBulge(a,b,tan){
 const {ux,uy}=tan, vx=b[0]-a[0], vy=b[1]-a[1], c2=vx*vx+vy*vy;
 const nx=-uy, ny=ux, den=2*(vx*nx+vy*ny);
 if(Math.abs(den)<1e-6)throw new Error("النهاية تقع على امتداد المماس — لا قوس محدود");
 const rr=c2/den, cx=a[0]+rr*nx, cy=a[1]+rr*ny;
 const A0=Math.atan2(a[1]-cy,a[0]-cx), A1=Math.atan2(b[1]-cy,b[0]-cx);
 let sw=A1-A0;
 while(sw<=-Math.PI)sw+=2*Math.PI;
 while(sw>Math.PI)sw-=2*Math.PI;
 if(rr<0&&sw>0)sw-=2*Math.PI;
 if(rr>0&&sw<0)sw+=2*Math.PI;
 return Math.tan(sw/4);
}
function centerBulge(c,a,b){
 const r=dist(c,a), r2=dist(c,b);
 if(r<1||Math.abs(r-r2)>Math.max(2,r*0.002))
  throw new Error("نقطتا البداية والنهاية يجب أن تبعدا المسافة نفسها عن المركز");
 const a0=Math.atan2(a[1]-c[1],a[0]-c[0]), a1=Math.atan2(b[1]-c[1],b[0]-c[0]);
 let sw=(a1-a0)%(2*Math.PI); if(sw<=0)sw+=2*Math.PI;
 if(sw>Math.PI)sw-=2*Math.PI;
 return Math.tan(sw/4);
}
function mkArcWall(ctx,a,b,p,forcedBulge){
 const bg=forcedBulge==null?bulgeFrom3(a,b,p):forcedBulge;
 if(!bg)throw new Error("النقاط على استقامةٍ (أو تكاد) — لا قوسَ بينها");
 const w=addWall(a,b,ovLen("arcwall","t"),ov("arcwall","type"),
  ov("arcwall","align")||"c",ovLen("arcwall","h"),bg);
 rec(ctx,w,"walls");
 const P=arcParams(w);
 H.rep("ok",`${w.id} · قوس ${m2(wallLen(w))} م · نصف القطر `
  +`${P?m2(P.R):"—"} م · ${P?(Math.abs(P.sweep)*180/Math.PI).toFixed(1):"—"}° `
  +`· ${mm(w.t).toFixed(2)} م`+(w.type==="low"?` · سترة ${m2(w.h)} م`:""));
 return w;
}
const projCircle=(c,a,b)=>{
 const r=dist(c,a),d=dist(c,b);
 if(d<1)throw new Error("نقطة النهاية منطبقة على المركز");
 return [Math.round(c[0]+(b[0]-c[0])*r/d),Math.round(c[1]+(b[1]-c[1])*r/d)];
};
const stripR=s=>String(s||"").trim().replace(/^(?:r|ر)\s*=?\s*/i,"");
function arcSteps(by){
 if(by==="r")return [
  {p:"نقطة البداية"},{p:"نقطة النهاية",base:0},
  {p:"نصف القطر (سالب للقوس الأكبر)",text:1,restart:1,
   fields:()=>[{k:"R",n:"نصف القطر",u:"م"}],
   each(ctx,s){
    const r=parseLength(stripR(s)); if(r==null||Math.abs(r)<1)throw new Error("اكتب نصف قطر موجباً، والسالب للقوس الأكبر");
    const a=ctx.pts[0],b=ctx.pts[1],g=T.ghost||[b[0],b[1]+1000];
    const side=Math.sign((b[0]-a[0])*(g[1]-a[1])-(b[1]-a[1])*(g[0]-a[0]))||1;
    mkArcWall(ctx,a,b,null,radiusBulge(a,b,r,side));
   }}];
 if(by==="cen")return [
  {p:"المركز"},{p:"نقطة البداية",base:0},
  {p:"نقطة النهاية أو a=الزاوية المركزية",base:0,restart:1,
   inputText(ctx,s){
    const m=/^(?:a|ز|زاوية)\s*=\s*(.+)$/i.exec(String(s).trim());
    if(!m)return false;
    const th=parseAngle(m[1])*D2R;
    const MAXA=4*Math.atan(8);
    if(!isFinite(th)||Math.abs(th)<1e-3)
     throw new Error(`الزاوية المركزية ${m[1]} غير صالحة — اكتب قيمة غير صفرية`);
    if(Math.abs(th)>MAXA)
     throw new Error(`الزاوية ${m[1]} تتجاوز حدّ القوس ${(MAXA*R2D).toFixed(0)}°`);
    const c=ctx.pts[0],st=ctx.pts[1],r=dist(c,st),a0=Math.atan2(st[1]-c[1],st[0]-c[0]);
    ctx.cenSweep=th;
    return feedPoint([Math.round(c[0]+r*Math.cos(a0+th)),Math.round(c[1]+r*Math.sin(a0+th))]);
   },
   each(ctx,b){
    const c=ctx.pts[0],st=ctx.pts[1],th=ctx.cenSweep;ctx.cenSweep=null;
    const e=th!=null?b:projCircle(c,st,b),dev=dist(e,b);
    mkArcWall(ctx,st,e,null,th!=null?Math.tan(th/4):centerBulge(c,st,e));
    if(dev>2)H.rep("wr",`النهاية أُسقطت على الدائرة (انحرفت ${m3(dev)} م عن النقرة)`);
   }}];
 if(by==="tan")return [
  {p:"نقطة النهاية (مماسّاً من الجدار السابق)",base:-1,loop:1,each(ctx){
   if(!ctx.tangent)throw new Error("لا يوجد جدار سابق لتحديد المماس");
   const P=ctx.pts,a=P[P.length-2],b=P[P.length-1];
   const bg=tangentBulge(a,b,ctx.tangent),w=mkArcWall(ctx,a,b,null,bg),A=arcParams(w);
   if(A){const sg=Math.sign(A.sweep)||1;ctx.tangent={ux:-Math.sin(A.a1)*sg,uy:Math.cos(A.a1)*sg}}
  }}];
 return [
  {p:"نقطة البداية"},{p:"نقطة النهاية",base:0},
  {p:"نقطة على القوس",base:0,box:1,restart:1,each(ctx,p){
   mkArcWall(ctx,ctx.pts[0],ctx.pts[1],p);
  }}];
}
defTool({
 id:"arcwall", alias:"aw arc قوس جدارقوسي", label:"جدار قوسي",
 hint:"اختر by=3p/r/cen/tan · افتراضي 3p",
 opts:[
  {k:"t",label:"السماكة م",type:"len",def:"0.15"},
  {k:"type",label:"النوع",type:"sel",seg:1,items:TY,def:"int"},
  {k:"align",label:"المحاذاة",type:"sel",items:AL,def:"c"},
  {k:"by",label:"طريقة الإنشاء",type:"sel",seg:1,items:[["3p","ثلاث نقاط"],["r","نصف القطر"],["cen","المركز"],["tan","مماس" ]],def:"3p"},
  {k:"h",label:"ارتفاع السترة م",type:"len",def:"1",when:o=>o.type==="low"}],
 start(ctx){
  const by=ov("arcwall","by")||"3p";
  T.steps=arcSteps(by);
  if(by==="tan"){
   const prev=S.walls[S.walls.length-1];
   if(!prev)throw new Error("لا يوجد جدار سابق للمماس");
   ctx.pts.push(prev.b.slice());
   const A=arcParams(prev);
   if(A){const sg=Math.sign(A.sweep)||1;ctx.tangent={ux:-Math.sin(A.a1)*sg,uy:Math.cos(A.a1)*sg}}
   else{const d=dir(prev);if(!d)throw new Error("الجدار السابق لا يحدد مماساً");ctx.tangent={ux:d.ux,uy:d.uy}}
  }
 },
 steps:arcSteps("3p"),
 prev(ctx,g){
  const P=ctx.pts,t=ovLen("arcwall","t")||150,by=ov("arcwall","by")||"3p",al=ov("arcwall","align")||"c";
  if(!P.length||!g)return [];
  const at=[g[0]+600,g[1]+600];
  /* القوس الحيّ بنصف قطره وزاويته ووتره وطوله — لكل الأوضاع */
  const arcPv=(a,b,bg,note)=>{
   if(!bg)return [pvLine(a,b,PNK),pvText(at,"استقامة — لا قوس",PNK)];
   const w={a,b,t,bulge:bg,align:al},A=arcParams(w),ring=band(w),o=[];
   if(ring)o.push(pvPoly(ring,GRN,1));
   else{const c=arcTess(w,0);if(c)o.push(pvPoly(c,PNK,0))}
   if(A){
    const sw=Math.abs(A.sweep);
    o.push(pvText(at,ring
     ?`R ${m2(A.R)} م · ${(sw*R2D).toFixed(1)}° · وتر ${m2(dist(a,b))} م · قوس ${m2(A.R*sw)} م`+(note||"")
     :`مرفوض: نصف القطر ${m2(A.R)} م < نصف السماكة ${m2(t/2)} م`,ring?YEL:PNK));
   }
   return o;
  };
  try{
   if(by==="cen"){
    if(P.length===1)return [pvLine(P[0],g,YEL),pvText(at,`نصف القطر ${m2(dist(P[0],g))} م`,YEL)];
    const c=P[0],st=P[1],e=projCircle(c,st,g);
    return [pvLine(c,st,"#4b5a6b"),pvLine(c,e,"#4b5a6b")].concat(arcPv(st,e,centerBulge(c,st,e)," · أو a=زاوية"));
   }
   if(by==="tan"){
    const a=P[P.length-1];
    if(!ctx.tangent||dist(a,g)<1)return [pvLine(a,g,YEL)];
    return arcPv(a,g,tangentBulge(a,g,ctx.tangent));
   }
   if(P.length===1)return [pvLine(P[0],g,YEL)];
   const a=P[P.length-2],b=P[P.length-1];
   if(by==="r")return [pvLine(a,b,"#4b5a6b")].concat(arcPv(a,b,bulgeFrom3(a,b,g)," · اكتب R (الأدنى "+m2(dist(a,b)/2)+")"));
   return [pvLine(a,b,"#4b5a6b")].concat(arcPv(a,b,bulgeFrom3(a,b,g)));
  }catch(e){return [pvLine(P[P.length-1],g,PNK),pvText(at,e.message,PNK)]}
 }});

/* ═══ مستطيل مرن ═══ */
const rectRot=()=>((+ov("rect","rot")||0)*D2R);
function rectCorners(a,p,spec){
 const base=ov("rect","base")||"corner", angle=(spec&&spec.angle!=null)?spec.angle:rectRot();
 let w,h,sx=1,sy=1;
 if(spec){w=spec.w;h=spec.h}
 else{
  const dx=p[0]-a[0],dy=p[1]-a[1],lx=dx*Math.cos(angle)+dy*Math.sin(angle),ly=-dx*Math.sin(angle)+dy*Math.cos(angle);
  sx=Math.sign(lx)||1;sy=Math.sign(ly)||1;
  const mul=base==="center"?2:1;w=Math.abs(lx)*mul;h=Math.abs(ly)*mul;
 }
 if(!(w>=500&&h>=500))throw new Error("المستطيل أصغر من 0.50 م");
 let o=a, x0=0,y0=0;
 if(!spec&&base==="center"){
  /* أبعاد النقرة من المركز إلى الركن المقابل؛ الضلعان كاملان. */
  x0=-w/2;y0=-h/2;
 }else if(spec&&base==="center"){
  x0=-w/2;y0=-h/2;
 }else if(!spec){x0=sx<0?-w:0;y0=sy<0?-h:0}
 const Q=[[x0,y0],[x0+w,y0],[x0+w,y0+h],[x0,y0+h]].map(([x,y])=>rotPt(o,x,y,angle));
 return {Q,w,h,angle,areaTarget:spec&&spec.areaTarget};
}
function rect3p(a,b,p){
 const {L,ux,uy}=lineBasis(a,b),nx=-uy,ny=ux;
 const h=(p[0]-b[0])*nx+(p[1]-b[1])*ny;
 if(Math.abs(h)<500)throw new Error("عمق المستطيل أقل من 0.50 م");
 const Q=[a,b,[Math.round(b[0]+nx*h),Math.round(b[1]+ny*h)],
  [Math.round(a[0]+nx*h),Math.round(a[1]+ny*h)]];
 return {Q,w:L,h:Math.abs(h),angle:Math.atan2(uy,ux)};
}
function emitRect(ctx,shape){
 const Q=shape.Q,as=ov("rect","as")||"wall",t=ovLen("rect","t"),ty=ov("rect","type"),al=ov("rect","align");
 if(as==="wall"){
  for(let i=0;i<4;i++)rec(ctx,addWall(Q[i],Q[(i+1)%4],t,ty,al),"walls");
 }else if(as==="pline")rec(ctx,addPline(Q,{closed:1}),"plines");
 else if(as==="slab")rec(ctx,addSlab(Q,ovLen("rect","th")||150),"struct");
 else if(as==="footing"){
  const cx=Q.reduce((x,p)=>x+p[0],0)/4,cy=Q.reduce((x,p)=>x+p[1],0)/4;
  rec(ctx,addFooting([cx,cy],shape.w,shape.h,shape.angle*R2D,
   ovLen("rect","th")||400),"struct");
 }
 const inner=al==="l"?"صافٍ":al==="r"?"كلّي":"محوري";
 const actual=shape.w*shape.h/1e6;
 let dims=ltr(`${m2(shape.w)}×${m2(shape.h)} م`);
 if(as==="wall"){
  const clear=al==="l"?[shape.w,shape.h]:al==="r"?[shape.w-2*t,shape.h-2*t]:[shape.w-t,shape.h-t];
  const gross=al==="l"?[shape.w+2*t,shape.h+2*t]:al==="r"?[shape.w,shape.h]:[shape.w+t,shape.h+t];
  dims=`صافٍ ${ltr(`${m2(clear[0])}×${m2(clear[1])}`)} · كلّي ${ltr(`${m2(gross[0])}×${m2(gross[1])} م`)}`;
 }
 const areaNote=shape.areaTarget==null?"":` · فرق المساحة ${(actual-shape.areaTarget).toFixed(3)} م²`;
 H.rep("ok",`${as==="wall"?"4 جدران":as==="pline"?"خطّ متعدّد مغلق":as==="slab"?"بلاطة":"قاعدة"} · ${dims} · ${actual.toFixed(3)} م²${areaNote} · ${inner}`);
}
const rectBaseAction={n:"من المركز",g:"⊙",touch:"من المركز",run(){
 const n=(ov("rect","base")||"corner")==="center"?"corner":"center";setOpt("rect","base",n);
 H.rep("in",n==="center"?"مركز المستطيل":"ركن المستطيل");H.prompt();H.draw();
}};
function rectSteps(by){
 const first={p:"الركن الأول أو المركز",opts:{e:rectBaseAction,"م":rectBaseAction}};
 if(by==="3p")return [first,{p:"نقطة على الضلع الأول",base:0},{p:"العمق أو الضلع المقابل",base:-1,box:1,restart:1,
  inputText(ctx,s){
   const d=parseLength(s);if(d==null)return false;
   if(!(d>=500))throw new Error("عمق المستطيل أقل من 0.50 م");
   const a=ctx.pts[0],b=ctx.pts[1],v=lineBasis(a,b),g=T.ghost||[b[0]-v.uy*1000,b[1]+v.ux*1000];
   const side=Math.sign((b[0]-a[0])*(g[1]-a[1])-(b[1]-a[1])*(g[0]-a[0]))||1;
   feedPoint([Math.round(b[0]-v.uy*d*side),Math.round(b[1]+v.ux*d*side)]);return true;
  },each(ctx,p){
   if((ov("rect","base")||"corner")==="center")throw new Error("المستطيل المائل لا يقبل base=center مع by=3p");
   emitRect(ctx,rect3p(ctx.pts[0],ctx.pts[1],p));
 }}];
 return [first,{p:"الركن المقابل أو المقاس",base:0,box:1,restart:1,
  fields:()=>[{k:"w",n:"العرض",u:"م"},{k:"h",n:"الطول",u:"م"},{k:"r",n:"الزاوية",u:"°"},{k:"A",n:"م²",u:""}],
  inputText(ctx,s){
   const z=norm(s).replace(/\s+/g,"");
   let w,h,angle=rectRot(),areaTarget=null;
   let m=/^a([^:x×]+)(?::|x|×)(.+)$/.exec(z);
   if(m){
    const area=Nx(m[1]); if(!(area>0))throw new Error("المساحة يجب أن تكون موجبة");areaTarget=area;
    if(z.includes(":")){ 
     const ratio=Nx(m[2]);if(!(ratio>0))throw new Error("النسبة يجب أن تكون موجبة");
     w=Math.round(Math.sqrt(area*ratio)*1000);h=Math.round(Math.sqrt(area/ratio)*1000);
    }else{
     const side=parseLength(m[2]);if(!(side>0))throw new Error("الضلع يجب أن يكون موجباً");
     const other=Math.round(area*1e6/side);w=Math.max(side,other);h=Math.min(side,other);
    }
    const a=ctx.pts[0],g=T.ghost;
    if(g&&dist(a,g)>1)angle=Math.atan2(g[1]-a[1],g[0]-a[0]);
   }else{
    m=/^(.+?)[x×](.+?)(?:<(.+))?$/.exec(z);
    if(!m)return false;
    w=parseLength(m[1]);h=parseLength(m[2]);
    if(w==null||h==null)throw new Error("المقاس يحتاج طولين مثل 3.6x4");
    if(m[3]!=null)angle=parseAngle(m[3])*D2R;
   }
   if(!(w>=500&&h>=500)){
    const mn=m3(Math.min(w,h));
    throw new Error(areaTarget!=null
     ?`المساحة ${areaTarget} م² تعطي ضلعاً ${mn} م — الأدنى 0.500 م`
     :`المقاس ${ltr(`${m3(w)}×${m3(h)}`)} م — الأدنى 0.500 م لكل ضلع`);
   }
   ctx.rectSpec={w,h,angle,areaTarget};
   const a=ctx.pts[0];
   const p=(ov("rect","base")||"corner")==="center"
    ?rotPt(a,w/2,h/2,angle):rotPt(a,w,h,angle);
   feedPoint(p);
   return true;
  },
  each(ctx,p){
   const q=ctx.rectSpec?rectCorners(ctx.pts[0],p,ctx.rectSpec):rectCorners(ctx.pts[0],p,null);
   ctx.rectSpec=null;emitRect(ctx,q);
  }}];
}
defTool({
 id:"rect",alias:"r مستطيل",label:"مستطيل",
 hint:"ركنان · 3.6x4<30 · A20:1.25 · E/م من المركز",
 opts:[
  {k:"t",label:"السماكة م",type:"len",def:"0.25"},
  {k:"type",label:"النوع",type:"sel",seg:1,items:TY,def:"ext"},
  {k:"align",label:"القياس",type:"sel",items:[["c","محوري"],["l","داخلي صافٍ"],["r","خارجي كلّي"]],def:"c"},
  {k:"base",label:"نقطة الارتكاز",type:"sel",items:[["corner","ركن"],["center","مركز"]],def:"corner"},
  {k:"rot",label:"الدوران °",type:"num",def:0},
  {k:"by",label:"طريقة الإنشاء",type:"sel",items:[["2p","ركنان"],["3p","ثلاث نقاط"]],def:"2p"},
  {k:"as",label:"الناتج",type:"sel",items:[["wall","جدران"],["pline","خط متعدد"],["slab","بلاطة"],["footing","قاعدة"]],def:"wall"},
  {k:"th",label:"السماكة الإنشائية م",type:"len",def:"0.15",when:o=>o.as==="slab"||o.as==="footing"}],
 start(ctx){
  const by=ov("rect","by")||"2p",base=ov("rect","base")||"corner";
  if(by==="3p"&&base==="center")throw new Error("المستطيل المائل لا يقبل base=center مع by=3p");
  T.steps=rectSteps(by);
 },
 steps:rectSteps("2p"),
 prev(ctx,g){
  if(!ctx.pts.length||!g)return [];
  try{
   const q=(ov("rect","by")||"2p")==="3p"&&ctx.pts.length>=2
    ?rect3p(ctx.pts[0],ctx.pts[1],g):rectCorners(ctx.pts[0],g,null);
   const al=ov("rect","align")||"c",t=ovLen("rect","t");
   const label=(ov("rect","as")||"wall")==="wall"
    ?`صافٍ ${ltr(`${m2(al==="l"?q.w:al==="r"?q.w-2*t:q.w-t)}×${m2(al==="l"?q.h:al==="r"?q.h-2*t:q.h-t)}`)} · كلّي ${ltr(`${m2(al==="l"?q.w+2*t:al==="r"?q.w:q.w+t)}×${m2(al==="l"?q.h+2*t:al==="r"?q.h:q.h+t)} م`)}`
    :ltr(`${m2(q.w)}×${m2(q.h)} م`);
   return [pvPoly(q.Q,GRN,1),pvText(g,label,YEL)];
  }catch(e){return [pvLine(ctx.pts[ctx.pts.length-1],g,PNK)]}
 }});

/* ═══ قياس ═══ */
/* S/س: مسار ← زاوية ← عنصر ← مسار — في الخطوة الأولى من كل وضع */
const MNEXT={path:"angle",angle:"ent",ent:"path"},MNAME={path:"مسار",angle:"زاوية",ent:"عنصر"};
const mcycle=()=>measureMode(MNEXT[ov("measure","mode")||"path"]);
const MCYC={s:{n:"الوضع التالي",g:"S",touch:"الوضع",run:mcycle},س:{n:"الوضع التالي",run:mcycle}};
const measurePathSteps=()=>[
 {p:"النقطة الأولى",opts:MCYC},
 {p:"النقطة التالية (Enter ينهي)",loop:1,base:-1,
  opts:{c:{n:"إغلاق",run(ctx){
   if(ctx.pts.length<3)throw new Error("الإغلاق يحتاج ثلاث نقاط");
   ctx.wantClosed=1;finish();
  }},u:{n:"تراجع",run(){undoStep()}}},
 }];
function measureAngleSteps(){return [
 {p:"رأس الزاوية",opts:MCYC},
 {p:"نقطة الذراع الأول",base:0},
 {p:"نقطة الذراع الثاني",base:0}
]}
const KN={col:"عمود",open:"فتحة",dim:"بُعد",text:"نص",room:"غرفة",slab:"بلاطة",footing:"قاعدة",beam:"كمرة"};
function measureEntitySteps(){return [
 {p:"انقر على جدار أو خط متعدد",ent:1,loop:1,opts:MCYC,each(ctx,h){
  const w=S.walls.find(x=>x.id===h.id),p=S.plines.find(x=>x.id===h.id);
  if(w){
   const A=arcParams(w),L=wallLen(w);
   let f;
   if(A){const sw=Math.abs(A.sweep);f=` · الوجه الداخلي ${m3(Math.max(0,A.R-w.t/2)*sw)} م · الخارجي ${m3((A.R+w.t/2)*sw)} م`}
   else f=` · الوجهان ${m3(L)} م`;
   H.rep("ok",`${w.id} · الطول ${m3(L)} م`+(A?` · نصف القطر ${m3(A.R)} م`:"")+f);
  }else if(p)H.rep("ok",`${p.id} · الطول ${m3(plineLen(p))} م`+(p.closed?" (محيط)":""));
  else throw new Error(`هذا العنصر ليس له طول (${KN[h.k]||h.k||h.id}) — اختر جداراً أو خطاً متعدداً`);
 }}]};
function measureMode(mode){
 const m=["path","angle","ent"].includes(mode)?mode:"path";
 setOpt("measure","mode",m);T.steps=m==="angle"?measureAngleSteps():
  m==="ent"?measureEntitySteps():measurePathSteps();
 T.i=0;if(T.ctx)T.ctx.pts.length=0;
 H.rep("in",`وضع القياس: ${{path:"مسار",angle:"زاوية",ent:"عنصر"}[m]}`);
 H.prompt();H.draw();
}
defTool({
 id:"measure", alias:"mi قياس مسافه", label:"قياس",
 hint:"نقاط متتالية · Enter ينهي · «ثبّت» يحوّلها أبعاداً حقيقية",
 /* ═══ «ثبّت» ═══ P-تحسين
    كان القياسُ لحظياً تماماً: ترى الرقمَ في السجلّ ويذهب، فإن أردتَه
    في الرسم أعدتَ العملَ بأداة «بُعد». والقياسُ هو نفسُه هندسةُ
    البُعد المحاذي، فالتحويلُ خطوةٌ واحدةٌ لا إعادةُ عمل.
    ومُطفأٌ افتراضاً: القياسُ في الأغلب سؤالٌ لا تأشير. */
 opts:[
  {k:"mode",label:"الوضع",type:"sel",seg:1,
   items:[["path","مسار"],["angle","زاوية"],["ent","عنصر"]],def:"path"},
  {k:"keep",label:"ثبّت كأبعاد",type:"chk",def:0,
   hint:"كلُّ ضلعٍ يصير بُعداً محاذياً — خطوةُ تراجعٍ واحدة"},
  {k:"off", label:"إزاحة البُعد م",type:"len",def:"0.5"},
  /* م١: المغلقُ محيطٌ ومساحة · المطفأُ (الافتراضي) سلوكُ اليوم */
  {k:"close",label:"مغلق",type:"chk",def:0}],
 start(){T.steps=ov("measure","mode")==="angle"?measureAngleSteps():
   ov("measure","mode")==="ent"?measureEntitySteps():measurePathSteps()},
 steps:measurePathSteps(),
 prev(ctx,g){
  if(ov("measure","mode")==="angle"&&ctx.pts.length&&g){
   const P=ctx.pts,o=[];
   if(P.length>=1)o.push(pvLine(P[0],P[1]||g,PNK));
   if(P.length>=2){
    o.push(pvLine(P[0],g,PNK));
    const a=[P[1][0]-P[0][0],P[1][1]-P[0][1]],b=[g[0]-P[0][0],g[1]-P[0][1]],la=Math.hypot(...a),lb=Math.hypot(...b);
    if(la>=1&&lb>=1){
     const q=Math.acos(Math.max(-1,Math.min(1,(a[0]*b[0]+a[1]*b[1])/(la*lb))))*R2D;
     o.push(pvText([g[0]+600,g[1]+600],`${q.toFixed(2)}° · المكمّلة ${(360-q).toFixed(2)}°`,YEL));
    }
   }
   return o;
  }
  const P=ctx.pts.concat(g?[g]:[]), o=[];
  for(let i=0;i<P.length-1;i++)o.push(pvLine(P[i],P[i+1],PNK));
  if(ovOn("measure","close")&&P.length>2)o.push(pvLine(P[P.length-1],P[0],PNK));
  return o;
 },
 done(ctx){
  const P=ctx.pts;
  if(ov("measure","mode")==="angle"){
   if(P.length!==3)throw new Error("قياس الزاوية يحتاج الرأس وذراعين");
   const v=P[0],a=[P[1][0]-v[0],P[1][1]-v[1]],b=[P[2][0]-v[0],P[2][1]-v[1]];
   const la=Math.hypot(...a),lb=Math.hypot(...b);
   if(la<1||lb<1)throw new Error("الذراع منطبق على الرأس");
   const q=Math.acos(Math.max(-1,Math.min(1,(a[0]*b[0]+a[1]*b[1])/(la*lb))))*R2D;
   H.rep("ok",`الزاوية ${q.toFixed(2)}° · المكمّلة ${(360-q).toFixed(2)}°`);
   if(ovOn("measure","keep")){
    const d=addDimAng(v,P[1],P[2],Math.max(200,ovLen("measure","off")||500));
    rec(ctx,d,"dims");
   }
   return;
  }
  if(P.length<2)return;
  const cl=P.length>2&&(ctx.wantClosed||ovOn("measure","close"));
  const E=cl?P.concat([P[0]]):P;
  /* التثبيت أوّلاً: الرقمُ الذي يُقال هو الذي كُتب */
  if(ovOn("measure","keep")){
   const off=Math.max(0,ovLen("measure","off"));
   const made=[];
   edit(()=>{
    for(let i=0;i<E.length-1;i++){
     /* البُعدُ المحاذي: `pos` إزاحةٌ على عمود الضلع نفسِه
        (dimGeom)، فلا حسابَ متجهٍ هنا ولا نسخةَ ثانيةٌ منه. */
     try{made.push(addDim("al",E[i],E[i+1],off))}
     catch(e){}
    }
   },"تثبيت القياس أبعاداً");
   made.forEach(d=>rec(ctx,d,"dims"));
   H.rep(made.length?"ok":"wr",
    made.length?`ثُبِّت ${made.length} بُعداً محاذياً — تُحرَّر كأيِّ بُعد`
     :"لم يُثبَّت شيء: الأضلاعُ أقصرُ من الحدّ الأدنى للبُعد");
  }
  let tot=0;
  for(let i=0;i<E.length-1;i++)
   tot+=Math.hypot(E[i+1][0]-E[i][0],E[i+1][1]-E[i][1]);
  let s=`${cl?"المحيط":"المسافة"} ${m3(tot)} م`;
  if(P.length===2){
   const a=((Math.atan2(P[1][1]-P[0][1],P[1][0]-P[0][0])
    *180/Math.PI)%360+360)%360;
   s+=` · الزاوية ${a.toFixed(1)}°`;
  }
  if(P.length>=3){
   let ar=0;
   for(let i=0,n=P.length;i<n;i++){
    const q=P[i], r=P[(i+1)%n];
    ar+=q[0]*r[1]-r[0]*q[1];
   }
   s+=` · المساحة ${(Math.abs(ar/2)/1e6).toFixed(3)} م²`;
  }
  H.rep("ok",s);
 }});


/* ═══ خطّ متعدّد حرّ مع الأقواس ═══ */
const bulgeRadius=(a,b,r,side)=>radiusBulge(a,b,r,side);
function plineTangent(ctx,end){
 const P=ctx.pts,a=P[end-1],b=P[end],bg=ctx.plBulges&&ctx.plBulges[end-1];
 if(bg){const A=arcParams({a,b,bulge:bg});if(A){const sg=Math.sign(A.sweep)||1;return {ux:-Math.sin(A.a1)*sg,uy:Math.cos(A.a1)*sg}}}
 const d=lineBasis(a,b);return {ux:d.ux,uy:d.uy};
}
function plinePoint(ctx,p){
 const P=ctx.pts,n=P.length;
 if(n<2)return;
 const i=n-2;let bg=0;
 if(ctx.plMode==="3p"){
  if(!ctx.plMid){ctx.plMid=p.slice();P.pop();return}
  bg=bulgeFrom3(P[i],p,ctx.plMid);
  if(!bg)throw new Error("النقاط الثلاث على استقامةٍ — لا قوس بينها");
  ctx.plMid=null;ctx.plMode="line";
 }else if(ctx.plRadius!=null){
  const g=T.ghost||[p[0],p[1]+1000];
  const side=Math.sign((p[0]-P[i][0])*(g[1]-P[i][1])-(p[1]-P[i][1])*(g[0]-P[i][0]))||1;
  bg=bulgeRadius(P[i],p,ctx.plRadius,side);ctx.plRadius=null;
 }else if(ctx.plMode==="arc"){
  if(n<3)throw new Error("القوس المماسّي يحتاج ضلعاً سابقاً — ارسم ضلعاً أو اختر S");
  bg=tangentBulge(P[i],p,plineTangent(ctx,n-2));
 }
 (ctx.plBulges||(ctx.plBulges=[]))[i]=bg;
}
function plineArcActions(){return {
 q:{n:"قوس",g:"◠",touch:"قوس",run(ctx){
  if(ctx.pts.length<2)throw new Error("القوس المماسّي يحتاج ضلعاً سابقاً — ارسم ضلعاً أو اختر S");
  ctx.plMode="arc";H.rep("in","قوس مماسّ · انقر النهاية أو اكتب r=نصف القطر أو S");
 }},
 ق:{n:"قوس",run(ctx){return plineArcActions().q.run(ctx)}}, 
 l:{n:"مستقيم",g:"—",touch:"مستقيم",run(ctx){ctx.plMode="line";ctx.plMid=null;ctx.plRadius=null;H.rep("in","وضع الخط المستقيم");}},
 ل:{n:"مستقيم",run(ctx){return plineArcActions().l.run(ctx)}},
 s:{n:"ثلاث نقاط",g:"S",touch:"ثلاث نقاط",run(ctx){
  if(ctx.pts.length<1)throw new Error("ابدأ بنقطة قبل اختيار S");
  ctx.plMode="3p";ctx.plMid=null;ctx.plRadius=null;H.rep("in","قوس بثلاث نقاط · حدّد نقطة على القوس ثم النهاية");
 }},
 س:{n:"ثلاث نقاط",run(ctx){return plineArcActions().s.run(ctx)}},
 c:{n:"إغلاق",run(ctx){
  if(ctx.pts.length<3)throw new Error("الإغلاق يحتاج ثلاث نقاط");ctx.wantClosed=1;finish();
 }},
 u:{n:"تراجع",run(){undoStep()}}
}}
function lastBg(ctx,P,g,i){
 const mode=ctx.plMode||"line",a=P[i],b=P[i+1];let bg=0;
 try{
  if(mode==="arc"&&i>0)bg=tangentBulge(a,b,plineTangent(ctx,i));
  else if(mode==="3p"&&ctx.plMid)bg=bulgeFrom3(a,b,ctx.plMid);
  else if(ctx.plRadius!=null){const side=Math.sign((b[0]-a[0])*(g[1]-a[1])-(b[1]-a[1])*(g[0]-a[0]))||1;bg=bulgeRadius(a,b,ctx.plRadius,side)}
 }catch(e){bg=0}
 return bg;
}
function plinePrev(ctx,g){
 const P=ctx.pts.slice(),o=[];
 if(g)P.push(g);
 for(let i=0;i<P.length-1;i++){
  let bg=(ctx.plBulges&&ctx.plBulges[i])||0;
  if(g&&i===P.length-2)bg=lastBg(ctx,P,g,i)||bg;
  if(bg){const c=arcTess({a:P[i],b:P[i+1],bulge:bg,t:0},0);if(c)for(let j=0;j<c.length-1;j++)o.push(pvLine(c[j],c[j+1],GRN));}
  else o.push(pvLine(P[i],P[i+1],GRN));
 }
 if(g&&ovOn("pline","closed")&&ctx.pts.length>1)o.push(pvLine(ctx.pts[0],g,"#4b5a6b"));
 if(g&&P.length>=2){
  /* م٣: R وطول القوس للضلع الحيّ، ثم الطول الكلّي حتى المؤشر */
  const i=P.length-2,bg=lastBg(ctx,P,g,i);let tot=0,note="";
  for(let j=0;j<P.length-1;j++){
   const b=j===i?bg:(ctx.plBulges&&ctx.plBulges[j])||0,A=b?arcParams({a:P[j],b:P[j+1],bulge:b}):null;
   tot+=A?A.R*Math.abs(A.sweep):dist(P[j],P[j+1]);
   if(j===i&&A)note=`R ${m2(A.R)} م · قوس ${m2(A.R*Math.abs(A.sweep))} م · `;
  }
  o.push(pvText([g[0]+600,g[1]+600],`${note}الكلّي ${m2(tot)} م`,YEL));
 }
 return o;
}
defTool({
 id:"pline",alias:"pl polyline متعدد متعرج",label:"خطّ متعدّد",
 hint:"Q قوس مماس · L مستقيم · S قوس بثلاث نقاط · r=4 نصف قطر",
 opts:[{k:"closed",label:"مغلق",type:"chk",def:0}],
 steps:[
  {p:"النقطة الأولى"},
  {p:"النقطة التالية (Enter ينهي)",loop:1,base:-1,min:1,opts:plineArcActions(),
   /* وضع القوس: حقل R يحلّ محلّ حقل الطول على اللمس */
   fields:ctx=>ctx&&(ctx.plMode==="arc")?[{k:"R",n:"نصف القطر",u:"م",pre:"r="}]:null,
   inputText(ctx,s){
    const m=/^r\s*=\s*(.+)$/i.exec(s);
    if(!m)return false;
    const r=parseLength(m[1]);if(r==null||Math.abs(r)<1)throw new Error("نصف قطر غير صالح");
    ctx.plRadius=r;ctx.plMode="radius";H.rep("in",`نصف القطر ${m[1]} · انقر نهاية القوس`);H.prompt();H.draw();return true;
   },each(ctx,p){plinePoint(ctx,p)} }],
 done(ctx){
  if(ctx.pts.length<2)throw new Error("الخطّ المتعدّد يحتاج نقطتين على الأقل");
  if(ctx.plMid)throw new Error("قوس S يحتاج نقطة نهاية بعد نقطة القوس");
  const closed=(ctx.wantClosed||ovOn("pline","closed"))&&ctx.pts.length>=3?1:0;
  const bulge=(ctx.plBulges||[]).slice(0,ctx.pts.length);
  const p=addPline(ctx.pts,{closed,bulge});rec(ctx,p,"plines");
  H.rep("ok",`${p.id} · ${m2(plineLen(p))} م · ${closed?"مغلق":"مفتوح"}`);
 },
 prev:plinePrev
});

/* دمج خطّين متعدّدين متقاربَي الطرفين — مع المحافظة على bulge واتجاهه. */
const reversePline=p=>{
 const pts=p.pts||[], n=pts.length;
 const P=pts.slice().reverse();
 const B=Array.from({length:Math.max(0,n-1)},(_,i)=>+(p.bulge||[])[i]||0)
  .reverse().map(x=>-x);
 return {pts:P,bulge:B};
};
function orientedAt(p,atStart){return atStart?reversePline(p):{pts:p.pts.slice(),bulge:(p.bulge||[]).slice()}}
defTool({
 id:"pjoin",alias:"ادمج_الخطوط joinpl",label:"دمج الخطوط",
 hint:`اختر خطّين متعدّدين بنهايتين متقاربتين (≤ ${WELD} مم)`,
 steps:[
  {p:"الخطّ الأول",ent:"pline",k:"a",entName:"خطّاً متعدّداً"},
  {p:"الخطّ الثاني",ent:"pline",k:"b",entName:"خطّاً متعدّداً",each(ctx,b){
   const a=plineById(ctx.v.a&&ctx.v.a.id),bb=plineById(b&&b.id);
   if(!a||!bb||a.id===bb.id)throw new Error("اختر خطّين مختلفين");
   if(a.closed||bb.closed)throw new Error("الدمج يقبل الخطوط المفتوحة فقط");
   const A=a.pts,B=bb.pts;
   const pairs=[[dist(A.at(-1),B[0]),0,0],[dist(A.at(-1),B.at(-1)),0,1],
    [dist(A[0],B[0]),1,0],[dist(A[0],B.at(-1)),1,1]].sort((x,y)=>x[0]-y[0]);
   const [gap,ra,rb]=pairs[0];
   if(gap>WELD)throw new Error(`الطرفان متباعدان ${m3(gap)} م (الحد ${m3(WELD)} م)`);
   const x=orientedAt(a,!!ra),y=orientedAt(bb,!!rb),join=x.pts.at(-1);
   y.pts[0]=join.slice();
   const pts=x.pts.concat(y.pts.slice(1));
   const bulge=x.bulge.slice(0,x.pts.length-1)
    .concat(y.bulge.slice(0,y.pts.length-1));
   const q=addPline(pts,{bulge});delPline(a);delPline(bb);rec(ctx,q,"plines");
   H.rep("ok",`${q.id} · دُمج الخطّان · ${m2(plineLen(q))} م`);
  }}]
});
