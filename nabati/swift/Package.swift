// swift-tools-version:5.9
import PackageDescription

// حزمة المحرك مستقلة تمامًا عن أي واجهة: لا UIKit ولا SwiftUI ولا Foundation
// خارج ما يلزم لفكّ ترميز JSON. تُبنى وتُختبر على Linux كما على macOS، وهذا
// شرط عملي هنا لأن التطوير يجري من متصفح عبر GitHub Actions لا من جهاز Mac.
let package = Package(
    name: "NabatiProsody",
    products: [
        .library(name: "NabatiProsody", targets: ["NabatiProsody"])
    ],
    targets: [
        .target(
            name: "NabatiProsody",
            path: "Sources/NabatiProsody",
            resources: [.copy("Resources")]
        ),
        .testTarget(
            name: "NabatiProsodyTests",
            dependencies: ["NabatiProsody"],
            path: "Tests/NabatiProsodyTests"
        ),
    ]
)
