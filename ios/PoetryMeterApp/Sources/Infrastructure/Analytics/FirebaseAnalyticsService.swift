import Foundation

// تنفيذ اختياري لـ AnalyticsService عبر Firebase Analytics.
//
// **لا يُبنى هذا الملف إطلاقًا حتى تُضيف حزمة Firebase عبر Xcode:**
//   File → Add Package Dependencies… → https://github.com/firebase/firebase-ios-sdk
//   اختر منتج "FirebaseAnalytics" فقط، ثم أضف GoogleService-Info.plist (راجع README.md).
// طالما لم تُضَف الحزمة، يبقى `#if canImport(FirebaseAnalytics)` أدناه معطَّلًا تلقائيًا، ويستمر التطبيق
// بالعمل عبر ConsoleAnalyticsService دون أي خطأ بناء.
#if canImport(FirebaseAnalytics)
import FirebaseAnalytics

struct FirebaseAnalyticsService: AnalyticsService {
    func logEvent(_ name: AnalyticsEvent, parameters: [String: String]) {
        Analytics.logEvent(name.rawValue, parameters: parameters)
    }
}
#endif
