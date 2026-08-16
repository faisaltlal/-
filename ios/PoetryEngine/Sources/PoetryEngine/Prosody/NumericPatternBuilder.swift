import Foundation

/// يبني النمط الرقمي (سلسلة 1/0) من تسلسل وحدات عروضية — التمثيل الأساسي المستخدم لاحقًا في مطابقة البحور.
enum NumericPatternBuilder {
    static func pattern(from units: [ProsodicUnit]) -> String {
        String(units.map(\.symbol))
    }
}
