// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "PoetryEngine",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(name: "PoetryEngine", targets: ["PoetryEngine"]),
        .executable(name: "poetry-compare", targets: ["PoetryCompare"])
    ],
    targets: [
        .target(
            name: "PoetryEngine",
            resources: [
                .process("Resources")
            ]
        ),
        .executableTarget(
            name: "PoetryCompare",
            dependencies: ["PoetryEngine"]
        ),
        .testTarget(
            name: "PoetryEngineTests",
            dependencies: ["PoetryEngine"]
        )
    ]
)
