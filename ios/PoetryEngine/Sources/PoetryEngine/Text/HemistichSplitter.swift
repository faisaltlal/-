import Foundation

/// يقسّم بيتًا شعريًا إلى شطرين. يبحث أولًا عن فاصل صريح (مسافات متعددة متتالية أو رمز فصل شائع)،
/// وإن لم يجده يلجأ لتقسيم تخميني بعدد الكلمات (النصف الأول يأخذ الكلمة الزائدة عند الفردية).
///
/// **قيد موثَّق:** حقول إدخال iOS تُطبّع عادة المسافات المتعددة إلى مسافة واحدة، فقد لا يصل الفاصل الصريح
/// كما كتبه المستخدم؛ التقسيم التخميني بالكلمات هو خط الدفاع الثاني، ويُسجَّل ذلك في `errors` عند استخدامه.
enum HemistichSplitter {
    struct Result {
        let firstRaw: String
        let secondRaw: String
        let wasExplicit: Bool
    }

    private static let explicitSeparators: [String] = ["   ", "  ", "\t", " / ", "/", " | ", "|", " — ", "—", " – ", " ... ", "…"]

    static func split(_ raw: String) -> Result {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return Result(firstRaw: "", secondRaw: "", wasExplicit: false)
        }

        for separator in explicitSeparators {
            if let range = trimmed.range(of: separator) {
                let before = String(trimmed[trimmed.startIndex..<range.lowerBound])
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                let after = String(trimmed[range.upperBound...])
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                if !before.isEmpty && !after.isEmpty {
                    return Result(firstRaw: before, secondRaw: after, wasExplicit: true)
                }
            }
        }

        let words = trimmed.split(separator: " ", omittingEmptySubsequences: true).map(String.init)
        guard words.count >= 2 else {
            return Result(firstRaw: trimmed, secondRaw: "", wasExplicit: false)
        }
        let splitIndex = Int((Double(words.count) / 2.0).rounded(.up))
        let first = words[0..<splitIndex].joined(separator: " ")
        let second = words[splitIndex...].joined(separator: " ")
        return Result(firstRaw: first, secondRaw: second, wasExplicit: false)
    }
}
