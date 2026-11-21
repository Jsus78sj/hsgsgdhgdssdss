/* ═══ ملخّصُ ما تُخطّي في قراءة DXF ═══ (v2.11.0)
   كان في io/dxfin.js، فكان الفاحصُ (core/inspect.js) يجرّ قارئَ DXF كلَّه
   (≈ 12 ك.ب مضغوطة مع cp1256) إلى رسم الإقلاع من أجل سطرٍ واحد. صار هنا
   ورقةً خالصة في core (لا استيرادَ من io: حدود الطبقات)، ويُعاد تصديرُه من dxfin.js فلا يتغيّر عقدٌ قائم.
   drop: مفاتيحُ تُذكَر برسالةٍ خاصّة فلا تُعاد في الملخّص العامّ */
import {ltr} from "./units.js";
export const skipSummary=(s,drop)=>Object.keys(s||{})
 .filter(k=>!(drop||[]).includes(k))
 .map(k=>`${k} ×${ltr(String(s[k]))}`).join(" · ");
