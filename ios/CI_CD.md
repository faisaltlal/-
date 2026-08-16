# CI/CD عبر GitHub Actions

يوجد Workflow-ان منفصلان في `.github/workflows/`:

| الملف | متى يعمل | ماذا يفعل |
|---|---|---|
| `ci.yml` | كل push وكل Pull Request إلى `main` | يبني ويختبر `PoetryEngine` و`PoetryMeterApp`، ثم يبني نسخة Simulator ويرفعها إلى Appetize.io للتجربة التفاعلية |
| `deploy.yml` | فقط عند نشر **Release** جديد على GitHub (أو تشغيل يدوي) | يعيد تشغيل الاختبارات، ثم يبني أرشيفًا موقَّعًا ويرفعه تلقائيًا إلى TestFlight |

**لماذا Fastlane لا `xcodebuild` + `altool`/`notarytool` مباشرة؟**
اخترتُ **Fastlane** (تحديدًا `build_app`/`gym` للأرشفة و`upload_to_testflight`/`pilot` للرفع) للأسباب التالية:
- `xcrun altool --upload-app` مُصنَّف من Apple كأداة قديمة (Legacy) منذ Xcode 13، و`notarytool` أصلًا لغرض مختلف تمامًا (Notarization لتطبيقات macOS خارج الـ App Store، لا علاقة له بـ TestFlight/iOS).
- Fastlane يدعم المصادقة عبر **App Store Connect API Key** بشكل مباشر ومُختبَر على نطاق واسع في آلاف مشاريع الـ CI، ويتولى تفاصيل تصدير الأرشيف (`ExportOptions.plist`) ورفعه في خطوة واحدة موثوقة، بدل تجميع عدة أوامر `xcodebuild`/`xcrun` منفصلة يدويًا وصيانتها بأنفسنا.
- توثيقه ومجتمعه أوسع بكثير عند حدوث أي مشكلة توقيع أو رفع.

البديل (`xcodebuild -exportArchive` + `xcrun altool`) ممكن تقنيًا ويعمل، لكنه أكثر هشاشة ويتطلب كودًا أكثر لتحقيق نفس النتيجة بلا فائدة إضافية حقيقية هنا.

---

## هل أحتاج جهاز Mac فعلي؟ لا — **كل خطوات هذا الـ Pipeline نفسه تعمل بالكامل على macOS runners من GitHub، بلا أي Mac شخصي.**

الاستثناء الوحيد المحتمل هو **إنشاء شهادة التوقيع (Distribution Certificate)**: الطريقة "التقليدية" تستخدم تطبيق Keychain Access على Mac لإنشاء CSR (Certificate Signing Request). **لكن هذا غير ضروري فعليًا** — القسم أدناه يشرح طريقة بديلة عبر `openssl` تعمل على أي نظام (Linux/Windows/الحاوية السحابية نفسها)، بلا Mac إطلاقًا. كل خطوة أخرى (تسجيل App ID، إنشاء Provisioning Profile، App Store Connect API Key، إنشاء التطبيق في App Store Connect) تتم بالكامل من متصفح الويب.

---

## القائمة الكاملة: ما يجب إعداده يدويًا قبل أول تشغيل

### أ) Appetize.io (المرحلة 1 — اختياري لكنه مطلوب للتجربة التفاعلية)

1. اذهب إلى [appetize.io](https://appetize.io) واضغط **Sign up** — يوجد خطة مجانية بحد شهري محدود من دقائق الاستخدام (تحقّق من الحد الحالي في صفحة الأسعار عندهم فقد يتغيّر).
2. بعد تسجيل الدخول، اذهب إلى **Account Settings** (أو **API** من القائمة الجانبية) — ستجد **API Token** جاهزًا (يبدأ عادة بحروف مثل `tok_`).
3. انسخه، ثم في مستودع GitHub: **Settings → Secrets and variables → Actions → Secrets tab → New repository secret**:
   - **Name:** `APPETIZE_API_TOKEN`
   - **Secret:** الصق التوكن.
4. هذا كل شيء — `ci.yml` سيرفع نسخة Simulator تلقائيًا في كل تشغيل ويطبع رابط التجربة في ملخّص الـ run (**Actions → اختر الـ run → Summary**).

> إن لم تضِف هذا السر، خطوة الرفع تتخطّى نفسها بأمان (لا تُفشل الـ workflow) وتطبع تنبيهًا فقط.

### ب) Apple Developer + App Store Connect (المرحلة 2 — إلزامي لتفعيل النشر لـ TestFlight)

يتطلب حساب **Apple Developer Program** مدفوع (99$/سنة) مسجَّلًا لك أو لمؤسستك.

#### 1. تحديد معرِّف الحزمة (Bundle ID) الحقيقي

المشروع يستخدم حاليًا `com.placeholder.poetrymeter` كـ Placeholder. سجّل معرِّفك الحقيقي:
- [developer.apple.com/account](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles → Identifiers → +** → App IDs → أدخل معرِّفًا مثل `com.yourname.poetrymeter`.
- لا تحتاج تعديل الكود لهذا — الـ CI يمرّره كمتغيّر (راجع القسم "أين تضيف كل قيمة" أدناه).

#### 2. إنشاء شهادة التوزيع (Apple Distribution Certificate) — **بلا Mac**

على أي جهاز (بما فيه هذه البيئة السحابية نفسها أو أي Linux/Windows):

```bash
# 1) أنشئ مفتاحًا خاصًا وطلب توقيع شهادة (CSR)
openssl genrsa -out ios_distribution.key 2048
openssl req -new -key ios_distribution.key -out ios_distribution.csr \
  -subj "/emailAddress=you@example.com, CN=Your Name, C=US"
```

- اذهب إلى **Certificates, Identifiers & Profiles → Certificates → +** → اختر **Apple Distribution** → ارفع ملف `ios_distribution.csr` → نزّل الشهادة الناتجة (`distribution.cer`).

```bash
# 2) حوّل الشهادة المُنزَّلة (.cer) + المفتاح الخاص إلى ملف .p12 واحد
openssl x509 -in distribution.cer -inform DER -out distribution.pem -outform PEM
openssl pkcs12 -export -out distribution.p12 \
  -inkey ios_distribution.key -in distribution.pem \
  -passout pass:CHOOSE_A_STRONG_PASSWORD
```

- احتفظ بـ `distribution.p12` وكلمة المرور التي اخترتها — ستحتاجهما أدناه. **لا ترفعهما إلى Git أبدًا.**

#### 3. إنشاء Provisioning Profile للتوزيع

- **Certificates, Identifiers & Profiles → Profiles → +** → **App Store Connect** (Distribution) → اختر الـ App ID من الخطوة 1 → اختر الشهادة من الخطوة 2 → **اسمِّه اسمًا واضحًا** (مثل `PoetryMeter AppStore`) — هذا الاسم بالذات هو قيمة `PROVISIONING_PROFILE_NAME` أدناه. نزّله (`.mobileprovision`).

#### 4. إنشاء App Store Connect API Key (بديل Apple ID/كلمة المرور/2FA — الطريقة الموصى بها للـ CI)

- [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Users and Access → Integrations → App Store Connect API** → **+** لإنشاء مفتاح جديد (صلاحية **App Manager** كافية).
- سيظهر لك مرة واحدة فقط: **Key ID**، **Issuer ID**، وزر تنزيل ملف `.p8`. نزّله فورًا (لا يمكن إعادة تنزيله لاحقًا).

#### 5. إنشاء سجل التطبيق في App Store Connect

- **App Store Connect → My Apps → +** → أنشئ تطبيقًا جديدًا بنفس Bundle ID المسجَّل في الخطوة 1، واسمه (Placeholder مقبول الآن، يُغيَّر لاحقًا).

#### 6. تحويل الملفات الثنائية إلى Base64 لوضعها كأسرار GitHub

```bash
base64 -i distribution.p12 | tr -d '\n' > cert_base64.txt
base64 -i PoetryMeter_AppStore.mobileprovision | tr -d '\n' > profile_base64.txt
base64 -i AuthKey_XXXXXXXXXX.p8 | tr -d '\n' > apikey_base64.txt
```
(على Linux استخدم `base64 -w 0` بدل `tr -d '\n'` إن لزم.)

---

## أين تضيف كل قيمة بالضبط في GitHub

من المستودع: **Settings → Secrets and variables → Actions**. يوجد تبويبان — **Secrets** (قيم سرّية مشفَّرة، لا تُقرأ بعد الحفظ) و**Variables** (قيم عادية غير سرّية، تظهر في السجلّات — لا تضع فيها شيئًا حساسًا).

### Secrets (تبويب Secrets → New repository secret)

| الاسم | القيمة | من أين |
|---|---|---|
| `APPETIZE_API_TOKEN` | توكن Appetize | قسم (أ) أعلاه |
| `BUILD_CERTIFICATE_BASE64` | محتوى `cert_base64.txt` | قسم (ب.2) |
| `P12_PASSWORD` | كلمة المرور التي اخترتها عند تصدير `.p12` | قسم (ب.2) |
| `BUILD_PROVISION_PROFILE_BASE64` | محتوى `profile_base64.txt` | قسم (ب.3) |
| `KEYCHAIN_PASSWORD` | كلمة مرور عشوائية من اختيارك (وليست من Apple) — تُستخدم فقط لقفل/فتح Keychain مؤقت داخل الـ CI run نفسه | اختَرها أنت، مثلًا عبر `openssl rand -base64 24` |
| `APP_STORE_CONNECT_API_KEY_ID` | Key ID | قسم (ب.4) |
| `APP_STORE_CONNECT_API_ISSUER_ID` | Issuer ID | قسم (ب.4) |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | محتوى `apikey_base64.txt` | قسم (ب.4) و(ب.6) |

### Variables (تبويب Variables → New repository variable)

| الاسم | القيمة | من أين |
|---|---|---|
| `APP_BUNDLE_IDENTIFIER` | معرِّف الحزمة الحقيقي (مثل `com.yourname.poetrymeter`) | قسم (ب.1) |
| `TEAM_ID` | معرِّف الفريق (10 أحرف/أرقام، يظهر أعلى يمين developer.apple.com/account أو ضمن صفحة Membership) | حساب Apple Developer |
| `PROVISIONING_PROFILE_NAME` | الاسم الذي اخترته للـ Profile بالضبط (مثل `PoetryMeter AppStore`) | قسم (ب.3) |

---

## الترتيب الموصى به لأول تشغيل

1. أضف كل Secrets/Variables أعلاه.
2. (اختياري لكن موصى به) ادفع أي commit صغير لـ `main` أو افتح Pull Request لتتأكد أن `ci.yml` ينجح أولًا (بناء + اختبار + رابط Appetize).
3. أنشئ Git tag ثم GitHub Release منه (مثلًا `v1.0.0`) من تبويب **Releases → Draft a new release**. نشر الـ Release هو ما يُشغِّل `deploy.yml`.
4. راقب الـ run من تبويب **Actions** — إن فشلت خطوة "Verify required secrets and variables are set" فالاسم المفقود مطبوع صراحة في السجلّ.
5. بعد نجاح الرفع، ستظهر النسخة في **App Store Connect → TestFlight** خلال دقائق (معالجة Apple التلقائية)، وتقدر تدعو مختبري Beta من هناك مباشرة.

## استكشاف الأخطاء الشائعة

- **"No profile matching found"**: تأكَّد أن `PROVISIONING_PROFILE_NAME` مطابق **حرفيًا** (بالمسافات والأحرف الكبيرة/الصغيرة) للاسم في Apple Developer، وأن الشهادة المستوردة (`BUILD_CERTIFICATE_BASE64`) هي نفس الشهادة التي بُني عليها ذلك الـ Profile تحديدًا.
- **"errSecInternalComponent" عند `security import`**: عادة يعني كلمة مرور `.p12` (`P12_PASSWORD`) غير صحيحة.
- **فشل `upload_to_testflight` بخطأ صلاحيات**: تأكَّد أن مفتاح App Store Connect API له صلاحية **App Manager** فأعلى، لا **Customer Support** أو أدنى.
- **"xcode-version input ... not found" أو فشل خطوة "Select Xcode"**: كلا الـ workflow يُثبِّتان إصدار Xcode على `16.2` تحديدًا (`xcode-version: "16.2"`) عبر `maxim-lobanov/setup-xcode`. صور macOS runners من GitHub تتغيّر بمرور الوقت وقد لا يتوفّر هذا الإصدار بالضبط مستقبلًا — إن فشلت هذه الخطوة، افتح [قائمة البرامج المثبَّتة على صورة الـ runner الحالية](https://github.com/actions/runner-images) (ملف `macos-*-Readme.md`) وغيّر رقم الإصدار في كلا الملفين (`ci.yml` و`deploy.yml`) لأقرب إصدار متوفّر فعليًا.
