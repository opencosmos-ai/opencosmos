// page-ink.swift — report how much ink is on each page of a scanned PDF, and
// export chosen pages as PNG.
//
// WHY. A diagram page and a blank page both come back from OCR with almost no
// text, and they are not the same thing. Ink density separates them: a plate or
// a table is dark and wordless, a blank leaf is pale and wordless. Pairing this
// with the OCR character count is how the figure pages in McClatchie get found
// without paging through five hundred scans by hand.
//
// BUILD
//   swiftc -O scripts/xenso/page-ink.swift -o <out>/page-ink \
//       -framework PDFKit -framework AppKit
//
// RUN
//   page-ink <in.pdf>                          # TSV: seq, ink%, top-heavy?, width, height
//   page-ink <in.pdf> --export 131,204 --dir figures --scale 4
//
// `ink%` is the share of pixels below mid-grey. `topHeavy` is the ink above the
// page's vertical midpoint minus the ink below it — a page whose ink sits in one
// band is usually a figure with a caption, where running text spreads evenly.

import AppKit
import Foundation
import PDFKit

let args = CommandLine.arguments
guard args.count >= 2 else {
    FileHandle.standardError.write("usage: page-ink <in.pdf> [--export 1,2,3] [--dir DIR] [--scale N]\n".data(using: .utf8)!)
    exit(2)
}

var exportList: [Int] = []
var outDir = "."
var scale: CGFloat = 4.0
// Horizontal strips per page. The Messages API scales an image down to 1568px on
// its long edge, so a whole page arrives with ~24px text — too small to read this
// print. Two strips of a 600 DPI page arrive at ~44px, which is legible.
var bands = 1
var i = 2
while i < args.count {
    switch args[i] {
    case "--export": exportList = args[i + 1].split(separator: ",").compactMap { Int($0) }; i += 2
    case "--dir":    outDir = args[i + 1]; i += 2
    case "--scale":  scale = CGFloat(Double(args[i + 1]) ?? 4.0); i += 2
    case "--bands":  bands = max(1, Int(args[i + 1]) ?? 1); i += 2
    default: i += 1
    }
}

guard let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else {
    FileHandle.standardError.write("cannot open \(args[1])\n".data(using: .utf8)!)
    exit(1)
}

func rasterise(_ page: PDFPage, scale: CGFloat) -> (CGImage, [UInt8], Int, Int)? {
    let box = page.bounds(for: .mediaBox)
    let w = Int(box.width * scale), h = Int(box.height * scale)
    guard w > 0, h > 0,
          let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8,
                              bytesPerRow: w, space: CGColorSpaceCreateDeviceGray(),
                              bitmapInfo: CGImageAlphaInfo.none.rawValue)
    else { return nil }
    ctx.setFillColor(gray: 1, alpha: 1)
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    ctx.scaleBy(x: scale, y: scale)
    ctx.translateBy(x: -box.minX, y: -box.minY)
    page.draw(with: .mediaBox, to: ctx)
    guard let image = ctx.makeImage(), let data = ctx.data else { return nil }
    let buf = UnsafeBufferPointer(start: data.assumingMemoryBound(to: UInt8.self), count: w * h)
    return (image, Array(buf), w, h)
}

if exportList.isEmpty {
    print("seq\tink_pct\ttop_heavy\twidth\theight")
    for seq in 1...doc.pageCount {
        guard let page = doc.page(at: seq - 1) else { continue }
        autoreleasepool {
            // Half scale is plenty for a density measurement and four times faster.
            guard let (_, px, w, h) = rasterise(page, scale: 1.5) else { return }
            var dark = 0, darkTop = 0
            for y in 0..<h {
                let row = y * w
                for x in 0..<w where px[row + x] < 128 {
                    dark += 1
                    if y < h / 2 { darkTop += 1 }
                }
            }
            let total = Double(w * h)
            let ink = Double(dark) / total * 100
            let top = dark == 0 ? 0 : (Double(darkTop) / Double(dark) - 0.5) * 2
            print(String(format: "%d\t%.3f\t%+.2f\t%d\t%d", seq, ink, top, w, h))
        }
    }
} else {
    try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)
    for seq in exportList {
        guard let page = doc.page(at: seq - 1) else { continue }
        autoreleasepool {
            guard let (image, _, w, h) = rasterise(page, scale: scale) else { return }
            if bands <= 1 {
                let rep = NSBitmapImageRep(cgImage: image)
                let path = "\(outDir)/page-\(String(format: "%03d", seq)).png"
                if let data = rep.representation(using: .png, properties: [:]) {
                    try? data.write(to: URL(fileURLWithPath: path))
                    print("\(path)\t\(w)x\(h)")
                }
                return
            }
            // Overlap by 3% so a line falling on a cut is whole in one of them.
            let bandH = h / bands
            let pad = Int(Double(h) * 0.03)
            for b in 0..<bands {
                let y0 = max(0, b * bandH - pad)
                let y1 = min(h, (b + 1) * bandH + pad)
                guard let crop = image.cropping(to: CGRect(x: 0, y: y0, width: w, height: y1 - y0))
                else { continue }
                let rep = NSBitmapImageRep(cgImage: crop)
                let path = "\(outDir)/page-\(String(format: "%03d", seq))-\(b + 1).png"
                if let data = rep.representation(using: .png, properties: [:]) {
                    try? data.write(to: URL(fileURLWithPath: path))
                    print("\(path)\t\(w)x\(y1 - y0)")
                }
            }
        }
    }
}
