import { useEffect, useRef, useState } from "react";

let pdfjsLibPromise = null;
function loadPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]).then(([pdfjsLib, workerUrl]) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.default;
      return pdfjsLib;
    });
  }
  return pdfjsLibPromise;
}

export default function PdfPreview({ file }) {
  const canvasRef = useRef(null);
  const docRef = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // load the document whenever a new file arrives
  useEffect(() => {
    let cancelled = false;
    if (!file) {
      docRef.current = null;
      setNumPages(0);
      setPageNum(1);
      return;
    }

    setLoading(true);
    setError("");
    Promise.all([loadPdfjs(), file.arrayBuffer()])
      .then(([pdfjsLib, buf]) => pdfjsLib.getDocument({ data: buf }).promise)
      .then((doc) => {
        if (cancelled) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
        setPageNum(1);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't preview this PDF.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  // render whichever page is current
  useEffect(() => {
    let cancelled = false;
    const doc = docRef.current;
    if (!doc || !canvasRef.current) return;

    doc.getPage(pageNum).then((page) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      const containerWidth = canvas.parentElement.clientWidth;
      const unscaledViewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale });

      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      page.render({ canvasContext: ctx, viewport });
    });

    return () => {
      cancelled = true;
    };
  }, [pageNum, numPages]);

  if (!file) return null;

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface/40 shrink-0">
        <p className="text-xs font-semibold text-ink">Preview</p>
        {numPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageNum((p) => Math.max(1, p - 1))}
              disabled={pageNum <= 1}
              className="text-muted disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="text-[11px] text-muted whitespace-nowrap">{pageNum} / {numPages}</span>
            <button
              onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
              disabled={pageNum >= numPages}
              className="text-muted disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto bg-surface/20 p-2 flex items-start justify-center">
        {loading && <p className="text-xs text-muted py-8">Loading preview…</p>}
        {error && <p className="text-xs text-red-500 py-8">{error}</p>}
        <canvas ref={canvasRef} className="w-full h-auto rounded-lg shadow-sm" style={{ display: loading || error ? "none" : "block" }} />
      </div>
    </div>
  );
}
