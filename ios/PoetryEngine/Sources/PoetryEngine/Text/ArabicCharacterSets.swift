import Foundation

/// ثوابت ومجموعات أحرف عربية مستخدمة في التطبيع والتحويل العروضي.
enum Arabic {
    // نقاط ترميز يونيكود للتشكيل (Combining marks) — تُلحق كجزء من الـ Character نفسه في سويفت.
    static let shadda: Unicode.Scalar = "\u{0651}"
    static let fatha: Unicode.Scalar = "\u{064E}"
    static let damma: Unicode.Scalar = "\u{064F}"
    static let kasra: Unicode.Scalar = "\u{0650}"
    static let sukun: Unicode.Scalar = "\u{0652}"
    static let fathatan: Unicode.Scalar = "\u{064B}"
    static let dammatan: Unicode.Scalar = "\u{064C}"
    static let kasratan: Unicode.Scalar = "\u{064D}"
    static let maddahAbove: Unicode.Scalar = "\u{0653}"
    static let superscriptAlef: Unicode.Scalar = "\u{0670}"
    static let tatweel: Unicode.Scalar = "\u{0640}"
    static let smallLowMeem: Unicode.Scalar = "\u{06E2}"

    // حروف مبنية (Base letters)
    static let alef: Character = "ا"
    static let alefMaqsura: Character = "ى"
    static let alefMadda: Character = "آ"
    static let hamzaAboveAlef: Character = "أ"
    static let hamzaBelowAlef: Character = "إ"
    static let hamzaAlone: Character = "ء"
    static let waw: Character = "و"
    static let ya: Character = "ي"
    static let taMarbuta: Character = "ة"
    static let lam: Character = "ل"
    static let noon: Character = "ن"

    /// الحروف الشمسية الأربعة عشر (يُدغم فيها لام التعريف).
    static let sunLetters: Set<Character> = ["ت", "ث", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ل", "ن"]

    /// مجموعة الحروف العربية الأساسية (بدون تشكيل) المعترف بها في المحرك.
    static let baseLetters: Set<Character> = [
        "ا", "أ", "إ", "آ", "ء", "ؤ", "ئ", "ب", "ت", "ث", "ج", "ح", "خ",
        "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ",
        "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي", "ى", "ة"
    ]

    /// علامات ترقيم شائعة نتجاهلها أثناء التحليل العروضي دون أن نفشل بسببها.
    static let ignorablePunctuation: Set<Character> = [
        "،", "؛", "؟", "!", ".", ",", ";", ":", "\"", "'", "«", "»",
        "(", ")", "[", "]", "{", "}", "-", "–", "—", "…", "*", "٭"
    ]

    static func isArabicBaseLetter(_ c: Character) -> Bool {
        baseLetters.contains(c)
    }

    static func isSunLetter(_ c: Character) -> Bool {
        sunLetters.contains(c)
    }
}
