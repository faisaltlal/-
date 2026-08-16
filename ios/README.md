# Poetry Meter (اسم Placeholder) — تطبيق iOS لوزن الشعر النبطي

تطبيق iOS Native (Swift + SwiftUI) يحلّل بيتًا شعريًا نبطيًا ويعرض بحره وطاروقه وتفعيلاته وتقطيعه العروضي ونمطه الرقمي وقافيته — بمحرك تحليل عروضي **محلي بالكامل (Offline)**، بلا أي اتصال شبكة مطلوب للوظيفة الأساسية.

> **حالة الهوية:** الاسم "Poetry Meter" واللوقو والألوان جميعها Placeholder مؤقت. غيّرها لاحقًا من `AppConfig.swift` (الاسم) و`project.yml` (`APP_DISPLAY_NAME`, `PRODUCT_BUNDLE_IDENTIFIER`) و`Assets.xcassets/AppIcon.appiconset` (الأيقونة).

## لماذا لا يوجد كود "منقول" من ميزان النبط؟

اقرأ `ARCHITECTURE_ANALYSIS.md` و`LICENSE_NOTES.md`: المستودع المرجعي (`mjt-png/mizan-nabt`) موقع تسويقي ثابت بلا أي محرك تحليل عروضي داخله. محرك هذا المشروع (`PoetryEngine`) **مبني من الصفر** استنادًا لعلم العروض العربي الكلاسيكي — راجع `POETRY_ENGINE.md` للتفاصيل الكاملة والمراجع.

## البنية

```
ios/
├── ARCHITECTURE_ANALYSIS.md   دراسة المشروع المرجعي (المرحلة 1)
├── LICENSE_NOTES.md            تحليل الترخيص والحقوق (المرحلة 2)
├── PORTING_PLAN.md             خطة البناء (المرحلة 2)
├── POETRY_ENGINE.md            توثيق محرك الوزن وقواعده
├── TESTING.md                  دليل الاختبارات وأداة المقارنة
├── ANALYTICS.md                سياسة التحليلات والخصوصية
├── README.md                   هذا الملف
├── PoetryEngine/                حزمة Swift Package مستقلة — محرك الوزن (بلا SwiftUI/UIKit)
│   ├── Package.swift
│   ├── Sources/PoetryEngine/    الكود: Models, Text, Prosody, Meter, Rhyme, Resources/meters.json
│   ├── Sources/PoetryCompare/   أداة سطر أوامر للمقارنة التطويرية (Expected vs Actual)
│   └── Tests/PoetryEngineTests/ اختبارات الوحدة والانحدار (Regression)
└── PoetryMeterApp/              تطبيق iOS (SwiftUI)
    ├── project.yml              مواصفة XcodeGen (يُولَّد منها .xcodeproj)
    ├── ExportOptions.plist      إعدادات تصدير الأرشيف لـ TestFlight
    ├── Sources/
    │   ├── App/                 نقطة الدخول (@main) وAppConfig
    │   ├── Presentation/         SwiftUI Views + ViewModels
    │   ├── Domain/               Use Cases (تربط المحرك بـ Analytics)
    │   └── Infrastructure/       Analytics, CrashReporting, Configuration
    ├── Resources/                Info.plist, Assets.xcassets, Localizable.strings
    └── Tests/                    اختبارات طبقة التطبيق (خصوصية Analytics بشكل أساسي)
```

## المتطلبات

- **macOS** مع **Xcode 15 أو أحدث** (لدعم Swift 5.9 وiOS 16 SDK). لم يُختبَر هذا المشروع فعليًا داخل Xcode بعد — بُني بالكامل في بيئة سحابية بلا Xcode متاح (راجع تنبيه `TESTING.md`)، فتأكَّد من فتحه وبنائه محليًا كخطوة أولى.
- **iOS 16.0+** كحد أدنى للتشغيل.
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) لتوليد ملف `.xcodeproj` من `project.yml` (`brew install xcodegen`).
- Swift toolchain لتشغيل `swift test` من سطر الأوامر مباشرة (يأتي مع Xcode، أو ثبّته من [swift.org](https://swift.org) على Linux).

## البدء السريع

```bash
# 1) توليد مشروع Xcode
brew install xcodegen   # مرة واحدة فقط
cd ios/PoetryMeterApp
xcodegen generate

# 2) فتحه في Xcode
open PoetryMeterApp.xcodeproj
```

داخل Xcode: اختر جهاز/محاكي iPhone (iOS 16+)، ثم `Cmd+R` للتشغيل، أو `Cmd+U` لتشغيل الاختبارات.

## تشغيل اختبارات المحرك بمعزل عن Xcode

```bash
cd ios/PoetryEngine
swift test
```

## تشغيل أداة المقارنة التطويرية

```bash
cd ios/PoetryEngine
swift run poetry-compare "<بيت الشعر>" [اسم-البحر-المتوقَّع]
```

راجع `TESTING.md` لتفاصيل أكثر.

## إعداد Firebase (اختياري)

التطبيق يعمل بكامل وظيفته الأساسية **بدون** Firebase (Analytics/Crash Reporting يعملان محليًا فقط عبر `os_log`، بلا أي إرسال). لتفعيل Firebase فعليًا:

1. أنشئ مشروع Firebase من [console.firebase.google.com](https://console.firebase.google.com)، وأضف تطبيق iOS بمعرّف الحزمة نفسه المُعرَّف في `project.yml` (`PRODUCT_BUNDLE_IDENTIFIER`، افتراضيًا `com.placeholder.poetrymeter` — غيّره أولًا لمعرِّفك الفعلي).
2. نزّل ملف `GoogleService-Info.plist` من Firebase Console، وضعه داخل `ios/PoetryMeterApp/Resources/`. **هذا الملف مُستثنى من Git عمدًا** (`ios/.gitignore`) — لا يُرفع أبدًا لأنه يحتوي معرِّفات مشروعك الخاص.
3. في Xcode: File → Add Package Dependencies… → أضف `https://github.com/firebase/firebase-ios-sdk`، واختر منتجَي `FirebaseAnalytics` و`FirebaseCrashlytics` فقط.
4. أعد بناء المشروع. بمجرد توفّر الحزمة، تُبنى تلقائيًا `FirebaseAnalyticsService.swift` و`FirebaseCrashReportingService.swift` (محميّان بـ `#if canImport(...)`)، ويستبدلهما `ServiceContainer` تلقائيًا بدل التنفيذ الافتراضي عبر `os_log`.
5. لرفع رموز تصحيح الأعطال (dSYM) لـ Crashlytics تلقائيًا عند الأرشفة، أضف Run Script Phase حسب [توثيق Firebase الرسمي](https://firebase.google.com/docs/crashlytics/get-started?platform=ios).

راجع `ANALYTICS.md` لسياسة الخصوصية الكاملة (لا يُجمع محتوى المستخدم إطلاقًا).

## إعدادات البناء (Build Configurations)

ثلاثة إعدادات مُعرَّفة في `project.yml`:

| الإعداد | الاستخدام | أدوات المطوّر في الواجهة |
|---|---|---|
| **Debug** | التطوير المحلي والمحاكي | تظهر (مدة التحليل، تفاصيل المحرك...) |
| **Beta** | أرشفة TestFlight | لا تظهر |
| **Release** | App Store | لا تظهر |

## إنشاء Build لِـ TestFlight

```bash
cd ios/PoetryMeterApp
xcodegen generate

xcodebuild archive \
  -project PoetryMeterApp.xcodeproj \
  -scheme PoetryMeterApp \
  -configuration Beta \
  -archivePath build/PoetryMeterApp.xcarchive \
  -destination "generic/platform=iOS"

xcodebuild -exportArchive \
  -archivePath build/PoetryMeterApp.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/export
```

قبل ذلك، عدِّل `ExportOptions.plist` وضع `teamID` الفعلي لحسابك في Apple Developer، وتأكَّد من ضبط Signing (Automatic أو Manual مع Provisioning Profile صحيح) داخل Xcode أولًا مرة واحدة. الرفع لـ TestFlight يتم بعدها عبر Xcode Organizer أو `xcrun altool`/Transporter، ثم توزيعه على مختبري Beta من App Store Connect مباشرة — لا حاجة لأي نظام حسابات داخل التطبيق نفسه.

سير العمل الكامل: **Claude Code → Xcode (بناء واختبار محلي) → Archive (Beta) → App Store Connect → TestFlight → مختبرو Beta → ملاحظات/تقارير أعطال (Crashlytics) → إصلاح → نسخة TestFlight جديدة.**

## التعريب (Localization)

اللغة الأساسية حاليًا عربية فقط (نصوص مباشرة في الكود، بدون طبقة `Localizable.strings` فعلية بعد). البنية جاهزة للتوسّع: `Resources/ar.lproj/Localizable.strings` موجود كنقطة بداية؛ لإضافة الإنجليزية لاحقًا: أضف `en.lproj/Localizable.strings` مقابلًا، واستبدل النصوص الحرفية في `Views/` باستدعاءات `String(localized:)`.

## القيود الحالية (بيئة التطوير)

- لم يُشغَّل `swift test` أو `xcodebuild` فعليًا أثناء كتابة هذا المشروع (بيئة Linux سحابية بلا Xcode/Swift toolchain متاح ولا وصول شبكة لـ swift.org). كل الكود روجع يدويًا بعناية، وكل نتيجة اختبار حُسبت خطوة بخطوة يدويًا قبل كتابتها (موثَّق في تعليقات الاختبارات). **أول خطوة يجب فعلها عند فتح المشروع محليًا: `swift test` ثم `xcodegen generate` والبناء في Xcode**، وإصلاح أي خطأ تركيب طارئ إن وُجد.
- أيقونة التطبيق (`AppIcon.appiconset`) فارغة (Placeholder فقط) — أضف صورة 1024×1024 فعلية قبل أي أرشفة لـ TestFlight/App Store.
- قاعدة بيانات البحور/الطواريق (٦ بحور، ١١ طاروقًا) نقطة بداية قابلة للتوسّع، وليست شاملة — راجع `POETRY_ENGINE.md`.
