// ocr-pdf.swift — rasterise a scanned PDF and OCR it with the system Vision framework.
//
// WHY THIS AND NOT TESSERACT. The McClatchie PDF is 498 JBIG2 page images with no
// text layer, and the book is bilingual — Chinese and English on facing pages.
// macOS ships an OCR engine that handles both and needs no install, no network
// and no npm dependency (adding one to this monorepo regenerates the shared
// lockfile, which has silently broken sibling apps' builds before).
//
// RESOLUTION, AND THE BUG THAT WAS HERE. The first McClatchie run used `--scale 3`,
// which rasterises the *MediaBox* at 3 × 72 = 216 DPI. The embedded page rasters are
// 2970 px across a 4.95-inch page — 600 DPI. Vision was shown a 2.8× downsample of a
// bitonal second-generation facsimile, and returned a ~10–12% word error rate while
// reporting a mean confidence of 0.98. The scale is now derived from the page's own
// embedded raster by default (`nativeWidthPx`), so the tool cannot silently throw
// away resolution again. `--dpi` or `--scale` override it.
//
// BUILD
//   swiftc -O scripts/xenso/ocr-pdf.swift -o <out>/ocr-pdf \
//       -framework PDFKit -framework Vision -framework AppKit
//
// RUN
//   ocr-pdf <in.pdf> <out.txt> [--from N] [--to N] [--langs en-US]
//           [--dpi N | --scale N] [--revision N] [--no-langcorrect] [--words f.txt]
//           [--merge | --force]
//
// Output is one file, pages separated by `\u{0C}[seq=N conf=…]`, which is the format
// harvest-hathitrust.js emits and `xenso:import-iching --only mcclatchie --from`
// already reads. Writing is non-destructive: a partial `--from/--to` run refuses to
// clobber a fuller file unless `--merge` (splice by seq) or `--force` is given.

import AppKit
import Foundation
import PDFKit
import Vision

struct Options {
    var input = ""
    var output = ""
    var from = 1
    var to = Int.max
    var scale: CGFloat? = nil      // nil = derive from the embedded raster
    var dpi: CGFloat? = nil
    var langs = ["en-US", "zh-Hant"]
    var revision: Int? = nil
    var langCorrect = true
    var wordsFile: String? = nil
    var merge = false
    var force = false
}

let usage = """
usage: ocr-pdf <in.pdf> <out.txt> [--from N] [--to N] [--langs en-US]
               [--dpi N | --scale N] [--revision N] [--no-langcorrect] [--words f.txt]
               [--merge | --force]

  --dpi N          rasterise at N DPI (scale = N/72)
  --scale N        rasterise at N × the MediaBox (N × 72 DPI)
                   default: match the page's own embedded raster, so no resolution is lost
  --revision N     pin VNRecognizeTextRequest.revision (reproducible, comparable runs)
  --no-langcorrect turn off usesLanguageCorrection — a modern lexicon "corrects"
                   1876 romanisation, so this is worth A/B-ing rather than assuming
  --words f.txt    one custom word per line. Vision only honours customWords when
                   language correction is ON, so this pairs with it, not against it
  --merge          splice this run's pages into an existing output, keeping the rest
  --force          overwrite an existing output even if it holds pages outside the range

"""

func parseArgs() -> Options {
    var o = Options()
    var positional: [String] = []
    var i = 1
    let a = CommandLine.arguments
    while i < a.count {
        switch a[i] {
        case "--from":           o.from = Int(a[i + 1]) ?? 1; i += 2
        case "--to":             o.to = Int(a[i + 1]) ?? Int.max; i += 2
        case "--scale":          o.scale = CGFloat(Double(a[i + 1]) ?? 3.0); i += 2
        case "--dpi":            o.dpi = CGFloat(Double(a[i + 1]) ?? 300); i += 2
        case "--langs":          o.langs = a[i + 1].split(separator: ",").map(String.init); i += 2
        case "--revision":       o.revision = Int(a[i + 1]); i += 2
        case "--no-langcorrect": o.langCorrect = false; i += 1
        case "--words":          o.wordsFile = a[i + 1]; i += 2
        case "--merge":          o.merge = true; i += 1
        case "--force":          o.force = true; i += 1
        default:                 positional.append(a[i]); i += 1
        }
    }
    guard positional.count >= 2 else {
        FileHandle.standardError.write(usage.data(using: .utf8)!)
        exit(2)
    }
    o.input = positional[0]
    o.output = positional[1]
    return o
}

// MARK: - Native resolution

/// Widest embedded image on the page, in pixels.
///
/// A scanned PDF is one big image per page, so this is the real resolution of the
/// scan — and rendering below it throws signal away that no OCR setting can recover.
/// Walks /Resources /XObject and takes the largest /Width among /Subtype /Image.
func nativeWidthPx(_ page: PDFPage) -> Int? {
    guard let ref = page.pageRef, let pageDict = ref.dictionary
    else { return nil }

    var resources: CGPDFDictionaryRef?
    guard CGPDFDictionaryGetDictionary(pageDict, "Resources", &resources),
          let res = resources
    else { return nil }

    var xobjects: CGPDFDictionaryRef?
    guard CGPDFDictionaryGetDictionary(res, "XObject", &xobjects),
          let xo = xobjects
    else { return nil }

    var widest = 0
    withUnsafeMutablePointer(to: &widest) { box in
        CGPDFDictionaryApplyFunction(xo, { _, value, info in
            guard let info else { return }
            var stream: CGPDFStreamRef?
            guard CGPDFObjectGetValue(value, .stream, &stream), let s = stream,
                  let dict = CGPDFStreamGetDictionary(s)
            else { return }

            var subtype: UnsafePointer<Int8>?
            guard CGPDFDictionaryGetName(dict, "Subtype", &subtype),
                  let st = subtype, String(cString: st) == "Image"
            else { return }

            var w: CGPDFInteger = 0
            guard CGPDFDictionaryGetInteger(dict, "Width", &w) else { return }

            let box = info.assumingMemoryBound(to: Int.self)
            if Int(w) > box.pointee { box.pointee = Int(w) }
        }, box)
    }
    return widest > 0 ? widest : nil
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

// MARK: - Recognition

func recognise(_ image: CGImage, opts: Options, words: [String]) -> (text: String, confidence: Float) {
    let request = VNRecognizeTextRequest()
    if let r = opts.revision, VNRecognizeTextRequest.supportedRevisions.contains(r) {
        request.revision = r
    }
    request.recognitionLevel = .accurate
    request.recognitionLanguages = opts.langs
    request.usesLanguageCorrection = opts.langCorrect
    if !words.isEmpty { request.customWords = words }
    // 1876 type on a 1973 photo-reproduction: the page is noisy and the lines are
    // close-set, so the default minimum text height is too coarse. This is a
    // fraction of image height, so it holds as the render resolution changes.
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

// MARK: - Non-destructive output
//
// The previous version wrote the whole file at the end, so `--from 200 --to 210`
// silently destroyed the other 488 pages. Pages are now keyed by seq and an
// existing file is only replaced where this run actually has something to say.

func readExisting(_ path: String) -> [Int: String] {
    guard let raw = try? String(contentsOfFile: path, encoding: .utf8) else { return [:] }
    var pages: [Int: String] = [:]
    for chunk in raw.components(separatedBy: "\u{0C}") where !chunk.isEmpty {
        guard let nl = chunk.firstIndex(of: "\n") else { continue }
        let marker = String(chunk[chunk.startIndex..<nl])
        guard let m = marker.range(of: #"seq=(\d+)"#, options: .regularExpression) else { continue }
        let digits = marker[m].dropFirst(4)
        guard let seq = Int(digits) else { continue }
        pages[seq] = chunk
    }
    return pages
}

// MARK: - Main

let opts = parseArgs()
guard let doc = PDFDocument(url: URL(fileURLWithPath: opts.input)) else {
    FileHandle.standardError.write("cannot open \(opts.input)\n".data(using: .utf8)!)
    exit(1)
}

func log(_ s: String) { FileHandle.standardError.write(s.data(using: .utf8)!) }

let last = min(opts.to, doc.pageCount)
let first = max(1, opts.from)

let existing = readExisting(opts.output)
let outside = existing.keys.filter { $0 < first || $0 > last }
if !outside.isEmpty && !opts.merge && !opts.force {
    log("""
        refusing to write \(opts.output): it already holds \(outside.count) page(s) outside \
        \(first)…\(last), which this run would destroy.
        Pass --merge to splice this range in, or --force to overwrite outright.

        """)
    exit(3)
}

var words: [String] = []
if let wf = opts.wordsFile {
    guard let raw = try? String(contentsOfFile: wf, encoding: .utf8) else {
        log("cannot read --words file \(wf)\n"); exit(1)
    }
    words = raw.split(separator: "\n")
        .map { $0.trimmingCharacters(in: .whitespaces) }
        .filter { !$0.isEmpty && !$0.hasPrefix("#") }
    if !opts.langCorrect {
        log("note: --words is ignored when --no-langcorrect is set (Vision requires language correction for customWords)\n")
    }
}

log("ocr-pdf: \(doc.pageCount) pages, doing \(first)…\(last) with \(opts.langs.joined(separator: ", "))\n")
log("  revisions supported: \(VNRecognizeTextRequest.supportedRevisions.sorted()), using \(opts.revision.map(String.init) ?? "default (\(VNRecognizeTextRequest.currentRevision))")\n")
log("  language correction: \(opts.langCorrect)\(words.isEmpty ? "" : ", \(words.count) custom words")\n")

var pages = opts.merge ? existing : [:]
var done = 0
var scalesSeen: Set<Int> = []

for seq in first...max(first, last) {
    guard let page = doc.page(at: seq - 1) else { continue }
    autoreleasepool {
        let box = page.bounds(for: .mediaBox)
        // Precedence: --scale, then --dpi, then the page's own embedded raster.
        let scale: CGFloat
        if let s = opts.scale {
            scale = s
        } else if let d = opts.dpi {
            scale = d / 72
        } else if let px = nativeWidthPx(page), box.width > 0 {
            scale = min(max(CGFloat(px) / box.width, 1), 12)
        } else {
            scale = 4
        }
        scalesSeen.insert(Int((scale * 72).rounded()))

        guard let image = render(page: page, scale: scale) else { return }
        let (text, conf) = recognise(image, opts: opts, words: words)
        pages[seq] = "[seq=\(seq) conf=\(String(format: "%.2f", conf))]\n\(text)\n\n"
        done += 1
        if done % 10 == 0 { log("  … \(seq)\n") }
    }
}

let out = pages.keys.sorted().map { "\u{0C}" + pages[$0]! }.joined()
try out.write(toFile: opts.output, atomically: true, encoding: .utf8)
log("rendered at \(scalesSeen.sorted().map(String.init).joined(separator: ", ")) DPI\n")
log("wrote \(done) page(s) (\(pages.count) in file) to \(opts.output)\n")
