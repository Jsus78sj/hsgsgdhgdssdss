## الملفات المضافة والمعدّلة · إكمال م٣ (2.16.1 ← 2.16.2)

### مضافة
- `src/tests/m3c.test.js` — اختبارات الإكمال (break للخط المتعدد، الرسائل، المعاينات، اللمس).

### معدّلة
- `src/core/plines.js` (`breakPline`) · `src/core/modify.js` (غلاف `breakPline` الذرّي)
- `src/tools/modify.js` (`break` يقبل الخط المتعدد) · `src/tools/draw.js` (سلسلة الجدار، القوسي، المستطيل، القياس، معاينة الخط المتعدد)
- `src/tools/annotate.js` (معاينة البُعد) · `src/tools/openings.js` (`cc` و`swing=cursor` والأبعاد المؤقتة) · `src/tools/parts.js` (تداخل القواعد ومحاور الكمرات)
- `src/tools/registry.js` (وضع `feedText.strict` لسلاسل الجدار)
- `src/ui/touchbar.js` · `src/ui/dyninput.js` (خطّافة `fields`، وحقول R والزاوية والمساحة)
- `package.json` (+ `test:m3c`، الإصدار) · `src/core/version.js` · `sw.js` · `CHANGES.md` · `CHANGED-FILES.md` · `docs/خطة-تطوير-أدوات-الرسم.md` (§١٥)

لا ملفّ محذوف. الإقلاع 814.3 ك.ب (الحدّ العام 820).

---

## الملفات المضافة والمعدّلة · إكمال م٢ (2.16.0 ← 2.16.1)

### معدّلة
- `src/core/osnap.js` (المرشّحون النقطيون المتعدّدون في النمط الواحد، بسقف 6 إضافيين)
- `src/core/entreg.js` (خطّاف `snap` لسلسلة الأبعاد `chain`)
- `src/tests/osnap-cycle.test.js` (+ مجموعة م٢ج، وتعديل فحصين) · `src/tests/osnap-sources.test.js` (+ سلاسل الأبعاد)
- `package.json` · `src/core/version.js` · `sw.js` (الإصدار 2.16.1) · `CHANGES.md` · `CHANGED-FILES.md` · `docs/خطة-تطوير-أدوات-الرسم.md` (§١٥)

لا ملفّ مضاف ولا محذوف. الإقلاع 810.5 ك.ب (الحدّ العام 820).

---

## الملفات المضافة والمعدّلة · المرحلة م٣ب (2.15.0 ← 2.16.0)

### مضافة
- `src/tests/m3b.test.js` — اختبارات القياس والأبعاد والفتحات والإنشاء الجماعي.

### معدّلة
- `src/tools/draw.js` (أوضاع القياس: مسار/زاوية/عنصر، وتثبيت الزاوية)
- `src/tools/annotate.js` (نوع البعد التلقائي، ونقرة الجدار/العمود)
- `src/tools/openings.js` (مرجع الجنب الصافي و`at=cc` وقلب الباب)
- `src/tools/parts.js` (القواعد تحت الأعمدة، كمرات المحاور، والتقاط البلاطة)
- `src/tools/registry.js` (إنهاء خطوة تلقائية بعد نقرة واحدة)
- `src/tests/scenarios.test.js` (السيناريو ٧: 0 نقرة و26 حرفاً) · `src/tests/stepkey-collision.test.js` (+ B)
- `package.json` (+ `test:m3b` و`test:m3`، الإصدار 2.16.0)
- `src/core/version.js` · `sw.js` (الإصدار)
- `docs/tools.md` · `docs/خطة-تطوير-أدوات-الرسم.md` · `CHANGES.md` · `CHANGED-FILES.md`

لا ملفّ محذوف. الإقلاع 809.6 ك.ب، دون الحد العام 820 ك.ب؛ لكن سقف م٣ (≤1 ك.ب فوق 800.0) ما زال غير محقّق.

# الملفات المضافة والمعدّلة · المرحلة م٣أ (2.14.0 ← 2.15.0)

## مضافة (4)
- `src/tests/m3a.test.js` · `src/tests/stepkey-collision.test.js` · `src/tests/touchbar-parity.test.js` · `src/tests/pjoin.test.js`

## معدّلة
- `src/tools/draw.js` (F/ف ومحاذاة الجدار · السلاسل المكتوبة · أوضاع arcwall · صيغ المستطيل ومخارجه · أقواس pline · دمج pjoin مع الأقواس)
- `src/core/walls.js` (محاذاة شريط الجدار القوسي)
- `src/tools/registry.js` (خطاف إدخال نصّ الخطوة)
- `src/ui/touchbar.js` (أزرار الخطوة السياقية) · `src/ui/ribbon/schema.js` (مدخل pjoin)
- `src/tests/scenarios.test.js` · `src/tests/tools-real.test.js` · `audit/11-ui-migration.md` · `package.json` (+ `test:m3a`)
- `src/core/version.js` · `sw.js` (الإصدار 2.15.0) · `docs/tools.md` · `docs/خطة-تطوير-أدوات-الرسم.md` (§١٥) · `CHANGES.md` · `CHANGED-FILES.md`

لا ملفّ محذوف. الإقلاع 805.0 ك.ب (الحدّ العام 820؛ معيار م٣ ≤1 ك.ب غير محقّق).

---

# الملفات المضافة والمعدّلة · المرحلة م٢ب (2.13.0 ← 2.14.0) — تُغلق م٢

## مضافة (4)
- `src/core/otrack.js` (تتبّع الكائنات والامتداد · كسولة، خارج الإقلاع)
- `src/tests/otrack.test.js` · `src/tests/from-point.test.js` · `src/tests/osnap-sources.test.js`

## معدّلة
- `src/core/osnap.js` (مصادر `snap(e)` · المحاور · سؤال فهرسٍ واحد) · `src/core/entreg.js` (خطّاف `snap` للخطّ المتعدّد والإنشائي والأبعاد) · `src/core/state.js` (تهجير `rb.otrack`)
- `src/ui/canvas.js` (التحميل الكسول للتتبّع والوقوف و`otTapAt` و`UI.osAcq` ورسم «+» والخطوط) · `src/tools/registry.js` («من» و`track` و`T.otk`) · `src/app.js` (`H.track`)
- `src/ui/touchbar.js` (شريحتا «من» و«تتبّع» · مفتاح التتبّع في ⚙) · `src/ui/statusbar.js` (مفتاح «تتبّع») · `src/ui/keymap.js` (اسم المفتاح) · `src/ui/icons.js` (أيقونة `track`)
- `src/ai/run.js` (إصلاح `trial` مع المُكرِّر — انحدارٌ من 2.12.1)
- `src/tests/perf-osnap-10k.test.js` (+ مجموعة م٢ب) · `src/tests/touch-shell.test.js` (المفتاح السادس)
- `sw.js` (CORE والإصدار) · `src/core/version.js` · `package.json` (+ `test:otrack` · `test:frompoint` · `test:osnapsources`) · `docs/tools.md` · `docs/خطة-تطوير-أدوات-الرسم.md` (§١٥) · `CHANGES.md` · `CHANGED-FILES.md`

لا ملفّ محذوف. الإقلاع 800.0 ك.ب (الحدّ 820).

---

# الملفات المضافة والمعدّلة · المرحلة م٢أ (2.12.1 ← 2.13.0)

## مضافة (3)
- `src/ui/osov.js` (شرائح التجاوز ومفتاح `os.pick` للمس · كسولة)
- `src/tests/osnap-cycle.test.js` · `src/tests/osnap-override.test.js`

## معدّلة
- `src/core/osnap.js` (`osnapAll` وسياسة `os.pick` و`o.only`) · `src/core/state.js` (تهجير `os.pick`)
- `src/ui/canvas.js` (`osCycle` والعدّاد والإسقاط على الشعاع · الملحق ١٤-٣) · `src/ui/dyninput.js` · `src/ui/keymap.js` (Tab) · `src/ui/touchbar.js` («⟳ التالي» والضغطة المطوّلة و`pick`)
- `src/tools/registry.js` (`OSW` و`osOverride` وحالة `T.osOv`) · `src/app.js` (مربّع «الأقرب يفوز»)
- `src/tests/precision-baseline.test.js` (١٤-٣ مقلوب) · `src/tests/perf-osnap-10k.test.js` (معيار 0.1) · `src/tests/dom.js` (+ مجموعة) · `src/tests/cover.js` (حذف `norm`)
- `sw.js` (CORE والإصدار) · `src/core/version.js` · `package.json` · `docs/tools.md` · `CHANGES.md` · `CHANGED-FILES.md`

لا ملفّ محذوف. الإقلاع 796.9 ك.ب (الحدّ 820).

---

# الملفات المضافة والمعدّلة · إكمال م١ — النقل الكسول (2.12.0 ← 2.12.1)

## مضافة (3)
- `src/ui/lazy-civil.js` (عقبُ ١٨ أداةً · مولَّد) · `scripts/gen-lazy-civil.js` (المولِّد و`--check`)
- `src/tests/lazy-civil.test.js` (38 فحصاً)

## معدّلة
- `src/tools/registry.js` (العقب: `begin` المؤجَّل وطابور الإدخال و`ensureTool` و`ensureAllLazy` و`stubsOf` و`lazyGuard`)
- `src/tools/tplscript.js` · `src/ai/run.js` (حارسٌ قبل أيّ مسّ) · `src/guide/engine.js` · `src/tutor/engine.js`
- `src/app.js` (يزيل ٧ استيراداتٍ ساكنة ويضيف العقب، و`useTemplate` يعيد مرّةً) · `src/ui/palette.js` (كذلك، و`toggleRecord` حركي)
- `src/tests/mobile-reach.test.js` (يمسح العقب) · `src/tests/dom.js` (+ مجموعة بنيوية)
- `index.html` (preload) · `sw.js` (CORE والإصدار) · `src/core/version.js` · `package.json` (سكربتات `test:lazycivil` و`lazy:gen` و`lazy:check`، وفحصٌ في `build`) · `CHANGES.md` · `CHANGED-FILES.md`
- `docs/م0-نتائج-البوابات.md` · `docs/خطة-تطوير-أدوات-الرسم.md` (§١٥)

لا ملفّ محذوف. الإقلاع 795.2 ك.ب (الحدّ 820).

---

# الملفات المضافة والمعدّلة · المرحلة م١ (2.11.0 ← 2.12.0)

## مضافة (6)
- `src/core/expr.js` (المحلّل الحسابي و DMS، كسول) · `src/core/exq.js` (الواجهة الإقلاعية الخفيفة)
- الاختبارات: `src/tests/expr.test.js` · `src/tests/exq.test.js` · `src/tests/relturn.test.js` · `src/tests/chain-drift.test.js` · `src/tests/chain-live.test.js` · `src/tests/measure-area.test.js` · `src/tests/quickwall-unit.test.js`

## معدّلة
- `src/core/coords.js` (التعابير و`<<` والموضع غير المقرَّب) · `src/core/dimension-input.js` (`INPUT_UNIT` و`BIG_BARE`)
- `src/tools/registry.js` (القلم الدقيق و`prevAng`) · `src/tools/draw.js` (القياس: `close` و`C` والمحيط) · `src/tools/quickwall.js`
- `src/ui/dyninput.js` · `src/ui/touchbar.js` (المعاينة وزر «نسبي») · `src/ui/props.js` · `css/cmd.css`
- `src/tests/scenarios.test.js` (٤ب) · `src/tests/phase2-batch.test.js` (المسار exq.js)
- `index.html` (preload) · `sw.js` (CORE والإصدار) · `src/core/version.js` · `package.json` · `CHANGES.md` · `CHANGED-FILES.md`

لا ملفّ محذوف.

---

# الملفات المضافة والمعدّلة · إكمال المرحلة م٠ (2.11.0، بلا تغيير سلوك)

## مضافة (2)
- `bench/inapp.js` (قياسٌ بالرسّام الحقيقي داخل نافذة التطبيق)
- `docs/م0-تجربة-الكسل.patch` (فرقُ تجربة النقل الكسول — مرجعٌ لم يُطبَّق)

## معدّلة
- `src/tests/precision-baseline.test.js` (+ مجموعة الملحق ١٤-٣)
- `src/tests/perf-osnap-10k.test.js` (+ مجموعة الملحق ١٤-٦)
- `bench/bench.js` · `bench/index.html` (وضع «بالرسّام الحقيقي»، ودفعات `osnap`، ودقة المؤقّت)
- `docs/م0-نتائج-البوابات.md` · `docs/خطة-تطوير-أدوات-الرسم.md` (§١٥) · `CHANGES.md` · `CHANGED-FILES.md`

لا ملفّ محذوف، ولا ملف منتج في `src/` غير الاختبارات. الإقلاع 816.2 ك.ب كما كان.

---

# الملفات المضافة والمعدّلة · المرحلة م٠ من خطة تطوير أدوات الرسم (2.11.0، بلا تغيير سلوك)

## مضافة (11)
- الاختبارات: `src/tests/precision-baseline.test.js` · `src/tests/perf-osnap-10k.test.js` · `src/tests/scenarios.test.js`
- صفحة القياس: `bench/index.html` · `bench/bench.js` · `bench/bench.css` · `bench/gen10k.js`
- القياس: `scripts/lazy-cost.js`
- الوثائق: `docs/م0-نتائج-البوابات.md` · `docs/م0-بروتوكول-اللمس.md` · `docs/خطة-تطوير-أدوات-الرسم.md`

## معدّلة
- `package.json` (+ `test:precision` · `test:perfosnap` · `test:scenarios` · `bench:lazy`)
- `src/tests/cover.js` (حذف مدخلين صار لهما اختبار)
- `CHANGES.md` · `CHANGED-FILES.md`

لا ملفّ محذوف، ولا ملف منتج في `src/` غير الاختبارات. الإقلاع 816.2 ك.ب كما كان.

---

# الملفات المضافة والمعدّلة — CivilDraft 2.9.1 ← 2.10.0 (المرحلة ٣-د · المياه والكهرباء والدرج والربط بالمخطّط)

## مضافة (19)
- الحاسبات (المياه): `src/calc/defs/` tank · septic · supplypipe · drainpipe · pipeslope
- الحاسبات (الكهرباء): `src/calc/defs/` hvac · lux · cable · panel
- الحاسبات (الدرج): `src/calc/defs/` stairs · ramp
- الحاسبة (الحديد): `src/calc/defs/slabbar.js`
- الربط بالمخطّط: `src/calc/link.js`
- الاختبارات: `src/tests/phase3d-calc.test.js`

## معدّلة
- المحرّك والجداول: `src/calc/engine.js` (ثلاث مجموعات جديدة) · `src/calc/tables.js` (STAIR · RAMP · MANNING · HAZEN · SEPTIC · CABLE · HVAC) · `src/calc/units.js` (flow · vel · power · volt · curr · illum · lum · xsec) · `src/calc/index.js` (42 حاسبة، و«العنصر المحدَّد» في Ctrl+K)
- الواجهة: `src/ui/calcPanel.js` (openCalcPanel(id, pre) و«العنصر المحدَّد»)
- الإصدار والبناء: `src/core/version.js` · `package.json` (+ `test:phase3d`) · `sw.js` (CORE مولّدة بـ gen-sw-core، 344 مورداً)
- الاختبارات القديمة: `src/tests/phase3b-calc.test.js` · `src/tests/phase3c-calc.test.js` · `src/tests/phase3c-close.test.js` (تُقبل الإصدارات الأحدث، والعدد بالحدّ الأدنى)
- الوثائق: `CHANGES.md` · `CHANGED-FILES.md` · `خطة-تطوير-CivilDraft.md`

لا ملفّ محذوف. الإقلاع لا يتأثّر: كلُّ `calc/` كسولٌ خارج رسم الإقلاع (يحرسه الاختبار).

---

# الملفات المضافة والمعدّلة — CivilDraft 2.9.0 ← 2.9.1 (إغلاق ٣-ج · BS 8110 كودٌ وحيد)

## مضافة (1)
- `src/tests/phase3c-close.test.js`

## معدّلة (7)
- `src/core/projinfo.js` (DESIGN_CODE · CODE_NOTE · codeConflict · conflictNote) · `src/ui/projhub.js` · `src/ui/calcPanel.js`
- الإصدار: `src/core/version.js` · `package.json` (+ `test:phase3c-close`) · `sw.js`
- الوثائق: `CHANGES.md` · `CHANGED-FILES.md` · `خطة-تطوير-CivilDraft.md`

لا ملفّ محذوف، ولا ملفّ جديد في CORE (فلا حاجة لـ gen-sw-core).

---

# الملفات المضافة والمعدّلة — CivilDraft 2.8.1 ← 2.9.0 (المرحلة ٣-ج · الأحمال والتربة · BS 8110)

## مضافة (10)
- الحاسبات: `src/calc/defs/` loads · matwt · beamdist · combos · wallload · bearing · footing · settle · earthp
- الاختبارات: `src/tests/phase3c-calc.test.js`

## معدّلة
- المحرّك والجداول: `src/calc/engine.js` (مجموعتا الأحمال والتربة) · `src/calc/tables.js` (BS8110_GF · DENSITY · IMPOSED · BEARING · SETTLE · WALLS) · `src/calc/units.js` (aload · lload · uw) · `src/calc/index.js`
- الإصدار والبناء: `src/core/version.js` · `package.json` (+ `test:phase3c`) · `sw.js` (CORE مولّدة بـ gen-sw-core)
- الاختبارات: `src/tests/phase3b-calc.test.js` (لا يفترض 21 حاسبة ولا 2.8.x)
- الوثائق: `CHANGES.md` · `CHANGED-FILES.md` · `خطة-تطوير-CivilDraft.md`

لا ملفّ محذوف. الواجهة (`calcPanel.js` · `palette.js` · الدليل) لم تتغيّر: تقرأ `calcList()` و`GROUPS`.

---

# الملفات المعدّلة — CivilDraft 2.8.0 ← 2.8.1 (إغلاق ٣-ب)

## معدّلة (6)
- `src/guide/catalog.js` (قشّة دروس الحاسبات) · `src/core/version.js` · `package.json` · `sw.js`
- الاختبارات: `src/tests/phase3b-calc.test.js`
- الوثائق: `CHANGES.md` · `CHANGED-FILES.md` · `خطة-تطوير-CivilDraft.md`

لا ملفّ مضاف ولا محذوف.

---

# الملفات المضافة والمعدّلة — CivilDraft 2.7.0 ← 2.8.0 (المرحلة ٣-ب · BS 8110)

## مضافة (10)
- الحاسبات: `src/calc/defs/` masonry · plaster · paint · tiles · insul · ceiling · excav · swell · trucks
- الاختبارات: `src/tests/phase3b-calc.test.js`

## معدّلة
- المحرّك والجداول: `src/calc/engine.js` (مجموعتان + `codeLine`) · `src/calc/tables.js` (BS 8110 · إزالة ACI 347/318) · `src/calc/index.js` · `src/calc/pdf.js` · `src/calc/defs/lapdev.js` · `src/calc/defs/formwork.js` · `src/calc/defs/mixdesign.js` (تنبيه الكود)
- الواجهة والمعلومات: `src/ui/calcPanel.js` · `src/core/projinfo.js`
- الإصدار والبناء: `src/core/version.js` · `package.json` · `sw.js` (CORE مولّدة بـ gen-sw-core)
- الاختبارات: `src/tests/phase3a-calc.test.js`
- الوثائق: `CHANGES.md` · `CHANGED-FILES.md` · `خطة-تطوير-CivilDraft.md`

لا ملفّ محذوف.

---

# الملفات المضافة والمعدّلة — CivilDraft 2.6.0 ← 2.7.0 (المرحلة ٣-أ)

## مضافة (19)
- المحرّك: `src/calc/engine.js` · `src/calc/index.js` · `src/calc/units.js` · `src/calc/tables.js` · `src/calc/pdf.js`
- الحاسبات: `src/calc/defs/` (units · shapes · slope · triangle · mixdesign · concmat · concvol · formwork · rebarwt · barsarea · lapdev · spacing)
- الواجهة: `src/ui/calcPanel.js`
- الاختبارات: `src/tests/phase3a-calc.test.js`

## معدّلة
- التطبيق: `src/app.js` · `src/ui/actions.js` · `src/ui/palette.js` · `src/ui/ribbon/schema.js` · `src/shell/mobile/props-sheet.js` · `src/guide/auto.js` · `src/guide/wire.js` · `src/core/version.js`
- الأنماط: `css/report.css`
- البناء: `package.json` · `sw.js`
- الاختبارات: `src/tests/cover.js` · `src/tests/dom.js` · `audit/11-ui-migration.md` (سطر calcDlg)
- الوثائق: `CHANGES.md` · `CHANGED-FILES.md` · `خطة-تطوير-CivilDraft.md` (أُصلح اسمُه أيضاً: كان مخزَّناً في الأرشيف برموز ‎#U062e…)

لا ملفّ محذوف.

---

# الملفات المضافة والمعدّلة — CivilDraft 2.5.0 ← 2.6.0 (إغلاق المرحلة ٢)

## مضافة (1)
- `src/tests/phase2-roles.test.js` — اختبارات المرحلة ٢ (139 فحصاً)

## معدّلة (16)
- التطبيق: `src/app.js` · `src/ui/roles.js` · `src/ui/welcome.js` · `src/ui/projhub.js` · `src/ui/ribbon/wire.js` · `src/i18n/en.js` · `src/core/version.js`
- الأنماط: `css/welcome.css` · `css/hub.css`
- البناء: `package.json` · `sw.js` · `index.html`
- الاختبارات: `src/tests/dom.js`
- الوثائق: `CHANGES.md` · `CHANGED-FILES.md` · `خطة-تطوير-CivilDraft.md`

لا ملفّ محذوف. التفاصيل في `CHANGES.md` (القسم الأخير).

---

# الملفات المضافة والمعدّلة — CivilDraft 2.2.0 ← 2.3.0 (المرحلة ١ من خطة التطوير)

## مضافة (6)
- `خطة-تطوير-CivilDraft.md` — خطة التطوير الكاملة (٩ مراحل) مع حالة تنفيذ المرحلة ١
- `scripts/size-budget.js` — قياس حجم الإقلاع (gzip) وميزانيته
- `src/core/errlog.js` — سجلّ الأعطال المحلي
- `src/core/offload.js` — نقل الفحص الثقيل إلى الخلفية
- `src/workers/compute.js` — عامل الحساب
- `src/tests/phase1-stability.test.js` — اختبارات المرحلة

## معدّلة (32)
- البناء وCI: `.github/workflows/android.yml` · `package.json` · `scripts/build-dist.js` · `scripts/gen-sw-core.js` · `sw.js` · `index.html` · `docs/tools.md`
- التطبيق: `src/bootguard.js` · `src/core/state.js` · `src/core/version.js` · `src/io/export.js` · `src/tools/section.js` · `src/tools/elev.js` · `src/tools/boqreport.js` · `src/ui/inspector.js` · `src/ui/actions.js` · `src/ui/appcmds.js` · `src/ui/appmenu.js` · `src/ui/icons.js` · `src/ui/ribbon/schema.js`
- الاختبارات: `src/tests/cover.js` · `csp.test.js` · `dom.js` · `export-all-ui.test.js` · `instant-opts.test.js` · `palette-cover.test.js` · `section-poche.test.js` · `section.test.js` · `tools-real.test.js` · `ui-reach.test.js`
- الوثائق: `CHANGES.md` · `KNOWN-DEFECTS.md` · `CHANGED-FILES.md`

لا ملفّ محذوف. التفاصيل في `CHANGES.md` (القسم الأول).

---

# الملفات المضافة والمعدّلة — CivilDraft 1.2.0 ← 2.0.0

انسخ مجلد cicidbsb-apk-main فوق المشروع الأصلي (استبدال)، ثم احذف الملف المحذوف أدناه.

## مضافة (22)
- `.gitignore`
- `docs/MOBILE-PLAN.md`
- `docs/PHASE4-PHONE-CHECK.md`
- `src/core/canonical-adapter.js`
- `src/core/canonical-contract.js`
- `src/core/canonical-import.js`
- `src/core/strict-edit.js`
- `src/io/canonical-project.js`
- `src/tests/phase9-health.test.js`
- `src/tests/phone-e2e.test.js`
- `src/tests/touch-phase1.test.js`
- `src/tests/touch-phase2.test.js`
- `src/tests/touch-phase3.test.js`
- `src/tests/touch-phase5.test.js`
- `src/tests/touch-phase6.test.js`
- `src/tests/touch-phase7.test.js`
- `src/tests/touch-phase8.test.js`
- `src/ui/backnav.js`
- `src/ui/fabdrag.js`
- `src/ui/toast.js`
- `src/ui/touchbar.js`
- `src/ui/touchtext.js`

## معدّلة (33)
- `CHANGES.md`
- `css/ribbon.css`
- `css/touch.css`
- `index.html`
- `package.json`
- `src/app.js`
- `src/core/guided-room.js`
- `src/core/quick-draw-transaction.js`
- `src/core/quick-opening.js`
- `src/core/quick-room.js`
- `src/core/quick-wall.js`
- `src/core/version.js`
- `src/platform/index.js`
- `src/tests/dom.js`
- `src/tests/harness.js`
- `src/tests/phase0-check.test.js`
- `src/tests/phaseB-ui.test.js`
- `src/tests/quickdraw-registration.test.js`
- `src/tests/quickopening-registration.test.js`
- `src/tests/quickroom-registration.test.js`
- `src/tests/quickwall-registration.test.js`
- `src/ui/appmenu.js`
- `src/ui/bus.js`
- `src/ui/canvas.js`
- `src/ui/ctxmenu.js`
- `src/ui/dyninput.js`
- `src/ui/optbar.js`
- `src/ui/props.js`
- `src/ui/ribbon/render.js`
- `src/ui/ribbon/wire.js`
- `src/ui/searchcommon.js`
- `src/ui/tour.js`
- `sw.js`

## محذوفة (1) — احذفها يدوياً
- `src/ui/searchIndex.js`

بعد النسخ: `node src/tests/all.js` ⇐ 250/250 · وللنشر: `node scripts/build-dist.js`
