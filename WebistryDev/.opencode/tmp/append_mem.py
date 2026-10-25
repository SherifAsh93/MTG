import sys

line = (
    "- **Mobile inline-PDF fix (13 Oct):** owner reported 'pdf could not be opened' on phone. "
    "Cause was pdfjs.getDocument({url}) streaming 32 MB lazily -> OOM/abort on phones. "
    "Rewrote CataloguePdfViewer.tsx: fetch(src) -> chunked Uint8Array (real progress bar, indeterminate fallback when content-length absent) -> getDocument({data}); "
    "setLoading(false) only after numPages + page1 ready, so grid reveals only once fully in memory (owner's load-before-appear). "
    "Bytes not Blob -> inline canvas on every OS, no native handoff. Typecheck fix: ArrayBuffer.set -> build Uint8Array. "
    "Deployed; Playwright iPhone 13 opens inline 44pp cover renders 0 errs; desktop 1280x900 + page-25 jump no regression.\n"
)

p = "/home/sherif/CHAT-MEMORY.md"
s = open(p, encoding="utf-8").read()
marker = "- **Verified:** 44 pages live"
i = s.find(marker)
if i == -1:
    print("MARKER_NOT_FOUND")
    sys.exit(1)
end = s.find("\n", i) + 1
s = s[:end] + line + s[end:]
open(p, "w", encoding="utf-8").write(s)
print("APPENDED")
