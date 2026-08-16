import Foundation
import PoetryEngine

/// أداة سطر أوامر تطويرية لمقارنة مخرجات المحرك (Actual) بتوقّع يدوي (Expected)، دون الحاجة لفتح Xcode.
/// الاستخدام:
///   swift run poetry-compare "<بيت الشعر>" [اسم-البحر-المتوقَّع]
///
/// مثال:
///   swift run poetry-compare "مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ   مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ" hijaini

let arguments = CommandLine.arguments

guard arguments.count >= 2 else {
    print("""
    الاستخدام:
      swift run poetry-compare "<بيت الشعر>" [اسم-البحر-المتوقَّع]
    """)
    exit(1)
}

let inputText = arguments[1]
let expectedMeterID: String? = arguments.count >= 3 ? arguments[2] : nil

let engine = PoetryEngine()
let result = engine.analyze(inputText)

print("== أداة مقارنة محرك الوزن ==")
print("النص المُدخَل: \(inputText)")
print("")
print("-- Actual --")
print("موزون: \(result.isMetered ? "نعم" : "لا")")
print("البحر: \(result.meter?.meter.name ?? "-")")
print("الطاروق: \(result.tarooq?.name ?? "-")")
print("درجة التشابه: \(String(format: "%.3f", result.meter?.similarity ?? 0))")
print("الثقة: \(String(format: "%.3f", result.confidence))")
print("الكتابة العروضية: \(result.prosodicText)")
print("النمط الرقمي: \(result.numericPattern)")
print("التفعيلات: \(result.feet.map { $0.footName ?? "؟(\($0.pattern))" }.joined(separator: " | "))")

if let rhyme = result.rhyme {
    let consistency = rhyme.isConsistent ? "نعم" : "لا"
    print("الروي: \(rhyme.firstHemistichRawi ?? "-") مقابل \(rhyme.secondHemistichRawi ?? "-") — متطابق: \(consistency)")
}
if !result.errors.isEmpty {
    print("تنبيهات: \(result.errors.map(\.localizedDescriptionAr).joined(separator: " / "))")
}
if !result.alternatives.isEmpty {
    let alts = result.alternatives.map { "\($0.meter.name) (\(String(format: "%.2f", $0.similarity)))" }.joined(separator: "، ")
    print("أقرب البدائل: \(alts)")
}

if let expectedMeterID {
    print("")
    print("-- Expected vs Actual --")
    let actualID = result.meter?.meter.id ?? "-"
    let isMatch = actualID == expectedMeterID
    print("\(isMatch ? "✓" : "✗") المتوقَّع: \(expectedMeterID)  |  الفعلي: \(actualID)")
    if !isMatch {
        exit(2)
    }
}
