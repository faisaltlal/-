import Foundation

// تنفيذ اختياري عبر Firebase Crashlytics.
//
// **لا يُبنى هذا الملف إطلاقًا حتى تُضيف حزمة Firebase عبر Xcode** (منتج "FirebaseCrashlytics"،
// بالإضافة إلى إضافة Run Script Phase الخاصة برفع رموز التصحيح — راجع README.md قسم "إعداد Firebase").
#if canImport(FirebaseCrashlytics)
import FirebaseCrashlytics

struct FirebaseCrashReportingService: CrashReportingService {
    func recordNonFatalError(_ error: Error, screen: String) {
        Crashlytics.crashlytics().setCustomValue(screen, forKey: "screen")
        Crashlytics.crashlytics().record(error: error)
    }

    func setCustomValue(_ value: String, forKey key: String) {
        Crashlytics.crashlytics().setCustomValue(value, forKey: key)
    }

    func log(_ message: String) {
        Crashlytics.crashlytics().log(message)
    }
}
#endif
