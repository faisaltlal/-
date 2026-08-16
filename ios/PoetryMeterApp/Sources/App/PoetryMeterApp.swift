import SwiftUI

@main
struct PoetryMeterApp: App {
    init() {
        ServiceContainer.analytics.logEvent(.appOpen)
    }

    var body: some Scene {
        WindowGroup {
            HomeView()
                .preferredColorScheme(nil) // يتبع إعداد النظام (فاتح/داكن) دون فرض أي منهما.
        }
    }
}
