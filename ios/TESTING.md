# الاختبارات (Testing)

## نظرة عامة

كل اختبارات محرك الوزن في `ios/PoetryEngine/Tests/PoetryEngineTests/`، وتعمل بمعزل تام عن iOS/Xcode عبر Swift Package Manager. اختبار خصوصية واحد في `ios/PoetryMeterApp/Tests/` يتحقق من عدم تسرّب نص البيت لطبقة Analytics.

```
ios/PoetryEngine/Tests/PoetryEngineTests/
├── TextNormalizerTests.swift        اختبارات التطبيع: مسافات، ترقيم، محتوى غير عربي، نسبة التشكيل
├── ProsodicTranscriberTests.swift   اختبارات كل قاعدة تحويل عروضي على حدة (شدة/تنوين/مد/لام شمسية-قمرية/لفظ الجلالة...)
├── FootLibraryTests.swift           تحقّق من النمط الرقمي المعياري لكل تفعيلة في meters.json
├── MeterDetectionTests.swift        مطابقة البحور والطواريق، تكامل المحرك الكامل من نص خام لنتيجة
├── RhymeAnalyzerTests.swift         تحليل القافية والروي
├── EdgeCaseTests.swift              نص فارغ، غير عربي، طويل جدًا، إيموجي، ترقيم فقط — بلا أي تعطّل
└── RegressionTests.swift            كل خطأ اكتُشف وأُصلح أثناء التطوير، مسجَّل هنا دائمًا
```

## تشغيل الاختبارات

**عبر سطر الأوامر (يتطلب Swift toolchain مثبَّتًا محليًا):**
```bash
cd ios/PoetryEngine
swift test
```

**عبر Xcode:** افتح `ios/PoetryMeterApp/PoetryMeterApp.xcodeproj` (بعد `xcodegen generate`)، ثم `Cmd+U`، أو من قائمة Test navigator شغّل `PoetryEngineTests` تحديدًا لتشغيلها بمعزل عن بقية التطبيق.

> **ملاحظة عن بيئة التطوير الحالية:** كُتبت كل الاختبارات والمحرك في بيئة سحابية بلا Xcode/Swift toolchain متاح (Linux، بلا وصول لـ swift.org عبر سياسة الشبكة)، فلم يتسنَّ تشغيل `swift test` فعليًا أثناء الكتابة. كل حالة اختبار في `ProsodicTranscriberTests.swift` و`MeterDetectionTests.swift` تتبَّعتُها يدويًا خطوة بخطوة عبر منطق الكود نفسه قبل كتابتها (موثَّق ذلك في تعليقات كل اختبار)، واكتشفتُ وأصلحتُ عبر هذا التتبّع خطأً فعليًا واحدًا (راجع `RegressionTests.swift`). **أول ما يجب فعله عند فتح المشروع في Xcode هو تشغيل `swift test` أو `Cmd+U` للتأكد من نجاح كل الاختبارات فعليًا**، وإصلاح أي خطأ تركيب (syntax) قد يكون تسرّب رغم المراجعة اليدوية الدقيقة.

## أداة المقارنة التطويرية (Comparison Tool)

أداة سطر أوامر (`poetry-compare`) لمقارنة `Expected` مقابل `Actual` أثناء تطوير المحرك، دون فتح Xcode:

```bash
cd ios/PoetryEngine
swift run poetry-compare "مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ   مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ" hijaini
```

تطبع الأداة: هل موزون، البحر، الطاروق، درجة التشابه، الثقة، الكتابة العروضية، النمط الرقمي، التفعيلات، الروي، وأقرب البدائل — ثم إن مُرِّر اسم بحر متوقَّع كوسيط ثانٍ، تقارنه بالفعلي وتخرج برمز حالة غير صفري عند الاختلاف (مفيد للاستخدام داخل سكربتات CI مستقبلًا).

## إضافة اختبار Regression جديد

عند اكتشاف أي خطأ وزن (بيت يُحلَّل بشكل خاطئ):
1. أضف حالة اختبار جديدة إلى `RegressionTests.swift` تعيد إنتاج الخطأ بالضبط (النص المُدخَل والنتيجة الصحيحة المتوقَّعة).
2. أصلح الخطأ في الكود.
3. تأكَّد أن الاختبار الجديد ينجح الآن، وأن بقية الاختبارات لم تنكسر.
4. وثِّق سبب الخطأ وطريقة إصلاحه في تعليق أعلى دالة الاختبار (كما في الأمثلة الموجودة).

## تغطية الحالات المطلوبة

| الحالة | أين تُختبَر |
|---|---|
| أبيات موزونة/غير موزونة | `MeterDetectionTests`, `EdgeCaseTests` |
| كل البحور الستة الابتدائية | `MeterDetectionTests`, `FootLibraryTests` |
| التشكيل الكامل / غياب التشكيل | `TextNormalizerTests.testDiacriticCoverageRatio*`, `EdgeCaseTests.testUnvocalizedInput...` |
| الشدة | `ProsodicTranscriberTests.testShaddaExpandsToSakinThenMutaharrik` |
| التنوين | `ProsodicTranscriberTests.testTanwinExpandsToVowelPlusSakinNoon` |
| اللام الشمسية | `ProsodicTranscriberTests.testSunLetterElidesLamAndDoublesFollowingLetter` |
| اللام القمرية | `ProsodicTranscriberTests.testMoonLetterKeepsLamSakinAndFollowingLetterSeparate` |
| حالات القافية | `RhymeAnalyzerTests` |
| حالات خاصة (لفظ الجلالة) | `ProsodicTranscriberTests.testJalalaSpecialCase*` |
