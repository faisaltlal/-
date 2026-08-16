import Foundation

/// بروتوكول تحليلات مجهولة الهوية بالكامل — لا يُمرَّر إليه أبدًا نص بيت شعري أو أي محتوى أدخله المستخدم،
/// ولا أي معرِّف شخصي (اسم/بريد/هاتف/موقع). راجع ../../../ANALYTICS.md لقائمة الأحداث الكاملة والسياسة.
protocol AnalyticsService: Sendable {
    func logEvent(_ name: AnalyticsEvent, parameters: [String: String])
}

extension AnalyticsService {
    func logEvent(_ name: AnalyticsEvent) {
        logEvent(name, parameters: [:])
    }
}

/// أسماء الأحداث المسموح بها فقط — قائمة مغلقة عن قصد لمنع أي تسرّب مستقبلي عرضي لبيانات حسّاسة
/// عبر تمرير اسم حدث حر (String) في مكان الاستدعاء.
enum AnalyticsEvent: String, Sendable {
    case appOpen = "app_open"
    case poemAnalyzed = "poem_analyzed"
    case analysisSucceeded = "analysis_success"
    case analysisFailed = "analysis_failed"
    case meterDetected = "meter_detected"
    case tarooqDetected = "tarooq_detected"
}
