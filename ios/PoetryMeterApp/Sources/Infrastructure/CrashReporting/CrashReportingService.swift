import Foundation

/// بروتوكول تسجيل الأعطال. لا يُمرَّر إليه أبدًا نص بيت شعري أو أي محتوى أدخله المستخدم أو بيانات شخصية —
/// فقط سياق تقني (اسم الشاشة، وصف الخطأ التقني).
protocol CrashReportingService: Sendable {
    func recordNonFatalError(_ error: Error, screen: String)
    func setCustomValue(_ value: String, forKey key: String)
    func log(_ message: String)
}

extension CrashReportingService {
    func recordNonFatalError(_ error: Error, screen: String = "unknown") {
        recordNonFatalError(error, screen: screen)
    }
}
