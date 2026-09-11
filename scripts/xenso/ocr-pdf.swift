// ocr-pdf.swift — rasterise a scanned PDF and OCR it with the system Vision framework.
//
// WHY THIS AND NOT TESSERACT. The McClatchie PDF is 498 JBIG2 page images with no
// text layer, and the book is bilingual — Chinese and English on facing pages.
// macOS ships an OCR engine that handles both and needs no install, no network
// and no npm dependency (adding one to this monorepo regenerates the shared
// lockfile, which has silently broken sibling apps' builds before).
//
// BUILD
//   swiftc -O scripts/xenso/ocr-pdf.swift -o <out>/ocr-pdf \
//       -framework PDFKit -framework Vision -framework AppKit
//
// RUN
//   ocr-pdf <in.pdf> <out.txt> [--from N] [--to N] [--scale 3] [--langs en-US,zh-Hant]
//
// Output is one file, pages separated by `\u{0C}[seq=N]`, which is the format
// harvest-hathitrust.js emits and `xenso:import-iching --only mcclatchie --from`
// already reads. A `[conf=…]` figure goes on each page marker so a bad page can
// be found without reading all five hundred.

import AppKit
import Foundation
import PDFKit
import Vision

struct Options {
    var input = ""
    var output = ""
    var from = 1
    var to = Int.max
    var scale: CGFloat = 3.0
    var langs = ["en-US", "zh-Hant"]
}

func parseArgs() -> Options {
    var o = Options()
    var positional: [String] = []
    var i = 1
    let a = CommandLine.arguments
    while i < a.count {
        switch a[i] {
        case "--from":  o.from = Int(a[i + 1]) ?? 1; i += 2
        case "--to":    o.to = Int(a[i + 1]) ?? Int.max; i += 2
        case "--scale": o.scale = CGFloat(Double(a[i + 1]) ?? 3.0); i += 2
        case "--langs": o.langs = a[i + 1].split(separator: ",").map(String.init); i += 2
        default:        positional.append(a[i]); i += 1
        }
    }
    guard positional.count >= 2 else {
        FileHandle.standardError.write(
            "usage: ocr-pdf <in.pdf> <out.txt> [--from N] [--to N] [--scale 3] [--langs en-US,zh-Hant]\n"
                .data(using: .utf8)!)
        exit(2)
    }
    o.input = positional[0]
    o.output = positional[1]
    return o
}

/// Renders one page to a grey bitmap. Grey rather than colour because the source
/// is bilevel JBIG2 — colour would triple the memory for no added signal.
func render(page: PDFPage, scale: CGFloat) -> CGImage? {
    let box = page.bounds(for: .mediaBox)
    let w = Int(box.width * scale), h = Int(box.height * scale)
    guard w > 0, h > 0,
          let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8,
                              bytesPerRow: 0, space: CGColorSpaceCreateDeviceGray(),
                              bitmapInfo: CGImageAlphaInfo.none.rawValue)
    else { return nil }

    ctx.setFillColor(gray: 1, alpha: 1)
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    ctx.scaleBy(x: scale, y: scale)
    ctx.translateBy(x: -box.minX, y: -box.minY)
    page.draw(with: .mediaBox, to: ctx)
    return ctx.makeImage()
}

func recognise(_ image: CGImage, langs: [String]) -> (text: String, confidence: Float) {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.recognitionLanguages = langs
    request.usesLanguageCorrection = true
    // 1876 type on a 1973 photo-reproduction: the page is noisy and the lines are
    // close-set, so the default minimum text height is too coarse.
    request.minimumTextHeight = 0.008

    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    do { try handler.perform([request]) } catch { return ("", 0) }

    guard let results = request.results, !results.isEmpty else { return ("", 0) }

    // Reading order. Vision returns observations in a bounding-box order that is
    // close to but not reliably top-to-bottom, so they are sorted explicitly.
    // Coordinates are normalised with the origin at the bottom left.
    let sorted = results.sorted { a, b in
        let dy = b.boundingBox.midY - a.boundingBox.midY
        if abs(dy) > 0.006 { return dy < 0 }
        return a.boundingBox.minX < b.boundingBox.minX
    }

    var lines: [String] = []
    var total: Float = 0
    for obs in sorted {
        guard let best = obs.topCandidates(1).first else { continue }
        lines.append(best.string)
        total += best.confidence
    }
    return (lines.joined(separator: "\n"), lines.isEmpty ? 0 : total / Float(lines.count))
}

let opts = parseArgs()
guard let doc = PDFDocument(url: URL(fileURLWithPath: opts.input)) else {
    FileHandle.standardError.write("cannot open \(opts.input)\n".data(using: .utf8)!)
    exit(1)
}

let last = min(opts.to, doc.pageCount)
FileHandle.standardError.write(
    "ocr-pdf: \(doc.pageCount) pages, doing \(opts.from)…\(last) at \(opts.scale)× with \(opts.langs.joined(separator: ", "))\n"
        .data(using: .utf8)!)

var out = ""
var done = 0
for seq in opts.from...max(opts.from, last) {
    guard let page = doc.page(at: seq - 1) else { continue }
    autoreleasepool {
        guard let image = render(page: page, scale: opts.scale) else { return }
        let (text, conf) = recognise(image, langs: opts.langs)
        out += "\u{0C}[seq=\(seq) conf=\(String(format: "%.2f", conf))]\n\(text)\n\n"
        done += 1
        if done % 10 == 0 {
            FileHandle.standardError.write("  … \(seq)\n".data(using: .utf8)!)
        }
    }
}

try out.write(toFile: opts.output, atomically: true, encoding: .utf8)
FileHandle.standardError.write("wrote \(done) pages to \(opts.output)\n".data(using: .utf8)!)
