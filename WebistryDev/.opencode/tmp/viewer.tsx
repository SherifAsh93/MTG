"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Download, Maximize2, Minus, Plus, X } from "lucide-react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";

type ExploreLink = { page: number; label: string; href: string };
type Props = { src: string; title: string; year: string | number; exploreLinks?: ExploreLink[] };

const MAX_RENDERED = 12;
const OVERSCAN = 700;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;

// "Explore this collection online" hotspot on a product page, as a fraction of the page box.
// Derived from the PDF: x 42.0-159.5pt of 595.5; the vertical band varies by layout.
const EXPLORE_X = [42 / 595.5, 159.5 / 595.5] as const;
function exploreBand(page: number): [number, number] {
  // pages 25/26 sit lower (band ~586-599pt); page 35 sits higher (~679-692pt) of 842.25.
  if (page === 35) return [676 / 842.25, 696 / 842.25];
  return [583 / 842.25, 602 / 842.25];
}

type RenderEntry = { task: { cancel: () => void; promise: Promise<void> } | null };

function coverHeading(title: string, year: string | number) {
  const y = String(year);
  return y && !title.includes(y) ? `${title} — Collection ${y}` : title;
}

function PdfScene({ src, title, year, onClose, exploreLinks = [] }: { src: string; title: string; year: string | number; onClose: () => void; exploreLinks?: ExploreLink[] }) {
  const linkByPage = new Map(exploreLinks.map(l => [l.page, l]));
  const [attempt, setAttempt] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [pageSize, setPageSize] = useState<{ w: number; h: number } | null>(null);
  const [baseW, setBaseW] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ready, setReady] = useState<Set<number>>(() => new Set());

  const panelRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const pageEls = useRef(new Map<number, HTMLElement>());
  const canvases = useRef(new Map<number, HTMLCanvasElement>());
  const rendered = useRef(new Map<number, RenderEntry>());
  const readyRef = useRef<Set<number>>(new Set());
  const widthRef = useRef(0);
  const pageRef = useRef(1);
  const zoomRef = useRef(1);
  const inputFocused = useRef(false);
  const anchorRef = useRef<number | null>(null);
  const pageSizeRef = useRef<{ w: number; h: number } | null>(null);

  widthRef.current = Math.round(baseW * zoom);
  pageRef.current = page;
  zoomRef.current = zoom;
  pageSizeRef.current = pageSize;

  useEffect(() => {
    let cancelled = false;
    let task: PDFDocumentLoadingTask | null = null;
    setLoading(true);
    setError("");
    setProgress(0);
    setNumPages(0);
    setPageSize(null);
    setPage(1);
    setPageInput("1");
    setReady(new Set());
    readyRef.current = new Set();
    rendered.current.forEach(entry => { try { entry.task?.cancel(); } catch { /* ignore */ } });
    rendered.current.clear();
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        // Fetch the whole PDF up front so we can (a) show true download progress
        // and (b) only reveal the viewer once it's fully in memory. Streaming
        // straight into PDF.js via { url } holds the connection open and OOMs
        // phones on large files; a completed ArrayBuffer parse is reliable on
        // any OS. We hand PDF.js the bytes (not a Blob/URL) so the browser's
        // PDF-plugin handoff never triggers and it stays inline in our canvas.
        const resp = await fetch(src, { credentials: "same-origin" });
        if (!resp.ok) throw new Error(`Download failed (${resp.status}).`);
        const total = Number(resp.headers.get("content-length")) || 0;
        let data: Uint8Array;
        if (resp.body && total) {
          const reader = resp.body.getReader();
          const chunks: Uint8Array[] = [];
          let loaded = 0;
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              loaded += value.length;
              const pct = Math.min(96, Math.round((loaded / total) * 100));
              if (!cancelled) setProgress(pct);
            }
          }
          data = new Uint8Array(loaded);
          let off = 0;
          for (const c of chunks) { data.set(c, off); off += c.length; }
        } else {
          // No content-length (some mobile proxies omit it) — still download the
          // whole body before parsing; show an indeterminate-ish climbing value.
          data = new Uint8Array(await resp.arrayBuffer());
          if (!cancelled) setProgress(96);
        }
        if (cancelled) return;
        setProgress(98);
        task = pdfjs.getDocument({ data });
        const doc = await task.promise;
        if (cancelled) return;
        pdfRef.current = doc;
        const first = await doc.getPage(1);
        if (cancelled) return;
        const vp = first.getViewport({ scale: 1 });
        setPageSize({ w: vp.width, h: vp.height });
        setNumPages(doc.numPages);
        setProgress(100);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError((e as Error)?.message || "The catalogue PDF could not be opened.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      void task?.destroy().catch(() => undefined);
      pdfRef.current = null;
    };
  }, [src, attempt]);

  const measure = useCallback(() => {
    const panel = panelRef.current;
    const el = wrapRef.current;
    if (!panel || !el || !panel.clientWidth || !el.clientWidth) return;
    const w = el.clientWidth - 24;
    let byHeight = Number.POSITIVE_INFINITY;
    const ps = pageSizeRef.current;
    if (ps && panel.clientHeight > 240) {
      const toolbar = panel.clientWidth >= 640 ? 56 : 52;
      const availH = panel.clientHeight - toolbar - 52;
      byHeight = availH * (ps.w / ps.h);
    }
    setBaseW(Math.max(200, Math.min(Math.round(w), 880, Math.round(byHeight))));
  }, []);

  useEffect(() => {
    measure();
    const panel = panelRef.current;
    if (!panel) return;
    const ro = new ResizeObserver(measure);
    ro.observe(panel);
    return () => ro.disconnect();
  }, [measure, pageSize]);

  const evict = useCallback(() => {
    if (rendered.current.size <= MAX_RENDERED) return;
    const panel = panelRef.current;
    const vh = panel ? panel.clientHeight : window.innerHeight;
    const vTop = panel ? panel.getBoundingClientRect().top : 0;
    const list: { n: number; d: number }[] = [];
    rendered.current.forEach((_, n) => {
      const el = pageEls.current.get(n);
      const d = el ? Math.abs(el.getBoundingClientRect().top + el.offsetHeight / 2 - (vTop + vh / 2)) : Number.MAX_SAFE_INTEGER;
      list.push({ n, d });
    });
    list.sort((a, b) => b.d - a.d);
    let over = rendered.current.size - MAX_RENDERED;
    for (const { n, d } of list) {
      if (over <= 0 || d < vh * 1.3) break;
      try { rendered.current.get(n)?.task?.cancel(); } catch { /* ignore */ }
      rendered.current.delete(n);
      const canvas = canvases.current.get(n);
      if (canvas) { canvas.width = 1; canvas.height = 1; }
      setReady(prev => {
        if (!prev.has(n)) return prev;
        const next = new Set(prev);
        next.delete(n);
        readyRef.current = next;
        return next;
      });
      over--;
    }
  }, []);

  const renderPage = useCallback(async (n: number, force = false) => {
    const doc = pdfRef.current;
    const canvas = canvases.current.get(n);
    if (!doc || !canvas || !widthRef.current) return;
    const existing = rendered.current.get(n);
    if (existing) {
      // Re-render a stuck entry: a page that is tracked as rendered but never
      // became ready (its task was cancelled/evicted mid-flight) would
      // otherwise be skipped forever and stay blank. Only bail when force is
      // off and the page is genuinely ready.
      if (!force && readyRef.current.has(n)) return;
      try { existing.task?.cancel(); } catch { /* ignore */ }
      rendered.current.delete(n);
    }
    try {
      const pdfPage = await doc.getPage(n);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const base = pdfPage.getViewport({ scale: 1 });
      const viewport = pdfPage.getViewport({ scale: (widthRef.current * dpr) / base.width });
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const entry: RenderEntry = { task: pdfPage.render({ canvas, canvasContext: ctx, viewport }) };
      rendered.current.set(n, entry);
      await entry.task!.promise;
      if (rendered.current.get(n) !== entry) return;
      setReady(prev => {
        if (prev.has(n)) return prev;
        const next = new Set(prev);
        next.add(n);
        readyRef.current = next;
        return next;
      });
      evict();
    } catch (e) {
      if ((e as Error)?.name !== "RenderingCancelledException") rendered.current.delete(n);
    }
  }, [evict]);

  const renderVisible = useCallback((force: boolean) => {
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    pageEls.current.forEach((el, n) => {
      const r = el.getBoundingClientRect();
      if (r.bottom > rect.top - OVERSCAN && r.top < rect.bottom + OVERSCAN) void renderPage(n, force);
    });
  }, [renderPage]);

  useEffect(() => {
    if (!numPages) return;
    const panel = panelRef.current;
    if (!panel) return;
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const n = Number((entry.target as HTMLElement).dataset.page);
          if (n) void renderPage(n);
        }
      }
    }, { root: panel, rootMargin: `${OVERSCAN}px 0px` });
    pageEls.current.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [numPages, renderPage]);

  useEffect(() => {
    if (!numPages || !baseW) return;
    renderVisible(true);
  }, [numPages, baseW, renderVisible]);

  useLayoutEffect(() => {
    if (anchorRef.current === null) return;
    const el = pageEls.current.get(pageRef.current);
    const panel = panelRef.current;
    if (el && panel) {
      const now = el.getBoundingClientRect().top - panel.getBoundingClientRect().top;
      panel.scrollBy(0, now - anchorRef.current);
    }
    anchorRef.current = null;
    renderVisible(true);
  }, [zoom, renderVisible]);

  useEffect(() => {
    if (!numPages) return;
    const panel = panelRef.current;
    if (!panel) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const rect = panel.getBoundingClientRect();
      const line = rect.top + rect.height * 0.35;
      let current = 1;
      for (let n = 1; n <= numPages; n++) {
        const el = pageEls.current.get(n);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = n;
        else break;
      }
      setPage(current);
      if (!inputFocused.current) setPageInput(String(current));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };
    panel.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => {
      panel.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [numPages]);

  const goTo = (n: number) => {
    const target = Math.min(Math.max(1, Math.round(n) || 1), numPages || 1);
    const el = pageEls.current.get(target);
    if (!el) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  };

  const changeZoom = (next: number) => {
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(next * 100) / 100));
    if (clamped === zoom) return;
    const el = pageEls.current.get(pageRef.current);
    const panel = panelRef.current;
    anchorRef.current = el && panel ? el.getBoundingClientRect().top - panel.getBoundingClientRect().top : null;
    setZoom(clamped);
  };

  const commitPage = () => {
    const n = Number(pageInput);
    if (n && n !== page) goTo(n);
    setPageInput(String(page));
  };

  return (
    <div className="pdf-panel" role="dialog" aria-modal="true" aria-label={`${title} catalogue viewer`} ref={panelRef}>
      <div className="pdf-viewer" ref={wrapRef}>
        <div className="pdf-toolbar" role="toolbar" aria-label="Catalogue PDF controls">
          <div className="pdf-toolbar-left">
            <button type="button" className="pdf-close" aria-label="Close the catalogue viewer" onClick={onClose}><X size={18} /></button>
            <p className="pdf-toolbar-title">{title}{String(year) && !title.includes(String(year)) ? ` / Collection ${year}` : ""}</p>
          </div>
          <div className="pdf-pager">
            <button type="button" aria-label="Previous page" disabled={loading || !!error || page <= 1} onClick={() => goTo(page - 1)}><ChevronUp size={18} /></button>
            <input
              aria-label="Page number"
              inputMode="numeric"
              autoComplete="off"
              value={pageInput}
              onFocus={e => { inputFocused.current = true; e.target.select(); }}
              onBlur={() => { inputFocused.current = false; commitPage(); }}
              onChange={e => setPageInput(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
              onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              disabled={loading || !!error}
            />
            <span aria-hidden="true">/ {numPages || "–"}</span>
            <button type="button" aria-label="Next page" disabled={loading || !!error || page >= numPages} onClick={() => goTo(page + 1)}><ChevronDown size={18} /></button>
          </div>
          <div className="pdf-tools">
            <button type="button" aria-label="Zoom out" className="pdf-zoom" disabled={loading || !!error || zoom <= ZOOM_MIN} onClick={() => changeZoom(zoom - 0.25)}><Minus size={17} /></button>
            <span className="pdf-zoom pdf-zoom-value" aria-hidden="true">{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label="Zoom in" className="pdf-zoom" disabled={loading || !!error || zoom >= ZOOM_MAX} onClick={() => changeZoom(zoom + 0.25)}><Plus size={17} /></button>
            <a className="pdf-download" href="/catalogue/download" download aria-label="Download the catalogue PDF"><Download size={17} /></a>
          </div>
        </div>
        {error ? (
          <div className="pdf-error" role="alert">
            <p>The catalogue PDF could not be opened.</p>
            <div className="pdf-error-actions">
              <button type="button" onClick={() => setAttempt(a => a + 1)}>Try again</button>
              <a href="/catalogue/download?view=1" target="_blank" rel="noopener noreferrer">Open the PDF in a new tab</a>
            </div>
          </div>
        ) : loading ? (
          <div className="pdf-loading" role="status">
            <div className="pdf-progress"><span style={{ width: `${progress}%` }} /></div>
            <p>{progress < 100 ? `Opening the catalogue… ${progress}%` : "Preparing pages…"}</p>
          </div>
        ) : null}
        {pageSize && !error && (
          <div className="pdf-scroll">
            <div className="pdf-pages">
              {Array.from({ length: numPages }, (_, i) => i + 1).map(n => (
                <div
                  key={n}
                  id={`pdf-page-${n}`}
                  data-page={n}
                  className="pdf-page"
                  style={{ width: Math.max(160, widthRef.current), aspectRatio: `${pageSize.w} / ${pageSize.h}` }}
                  ref={el => {
                    if (el) pageEls.current.set(n, el);
                    else pageEls.current.delete(n);
                  }}
                >
                  <canvas
                    ref={el => {
                      if (el) canvases.current.set(n, el);
                      else canvases.current.delete(n);
                    }}
                  />
                  {linkByPage.has(n) && (() => {
                    const link = linkByPage.get(n)!;
                    const [y0, y1] = exploreBand(n);
                    return (
                      <a
                        className="pdf-explore-link"
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.label}
                        style={{
                          left: `${EXPLORE_X[0] * 100}%`,
                          width: `${(EXPLORE_X[1] - EXPLORE_X[0]) * 100}%`,
                          bottom: `${y0 * 100}%`,
                          height: `${(y1 - y0) * 100}%`,
                        }}
                      />
                    );
                  })()}
                  {!ready.has(n) && <div className="pdf-page-placeholder" aria-hidden="true"><span>{n}</span></div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CataloguePdfViewer({ src, title, year, exploreLinks }: Props) {
  const [everOpened, setEverOpened] = useState(false);
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);

  const openViewer = () => {
    setEverOpened(true);
    setOpen(true);
  };

  const closeViewer = useCallback(() => {
    setOpen(false);
    openerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeViewer(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeViewer]);

  return (
    <>
      <section className="catalogue-cover">
        <div className="catalogue-cover-inner">
          <p className="catalogue-cover-kicker">QOYA Furniture · Official Catalogue</p>
          <h1 className="catalogue-cover-title">{coverHeading(title, year)}</h1>
          <button type="button" className="catalogue-cover-open" ref={openerRef} onClick={openViewer}>
            <span className="catalogue-cover-card" aria-hidden="true">
              <span className="catalogue-cover-card-kicker">Collection</span>
              <span className="catalogue-cover-card-year">{String(year)}</span>
              <span className="catalogue-cover-card-name">{title}</span>
              <span className="catalogue-cover-card-tag">Full PDF Catalogue</span>
            </span>
            <span className="catalogue-cover-cta">Open the catalogue <Maximize2 size={15} strokeWidth={1.7} /></span>
          </button>
          <p className="catalogue-cover-hint">Flip through every page — zoom, jump to a page, or download.</p>
        </div>
      </section>
      {everOpened && (
        <div
          className={"pdf-overlay" + (open ? "" : " is-closed")}
          onClick={e => { if (e.target === e.currentTarget) closeViewer(); }}
        >
          <PdfScene src={src} title={title} year={year} onClose={closeViewer} exploreLinks={exploreLinks} />
        </div>
      )}
    </>
  );
}
