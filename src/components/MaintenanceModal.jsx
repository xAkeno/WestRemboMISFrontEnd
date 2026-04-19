import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function MaintenanceModal({ message }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    const enforce = () => {
      el.style.setProperty("display", "flex", "important");
      el.style.setProperty("visibility", "visible", "important");
      el.style.setProperty("opacity", "1", "important");
      el.style.setProperty("pointer-events", "all", "important");
    };

    enforce();

    const observer = new MutationObserver(() => enforce());
    observer.observe(el, { attributes: true, attributeFilter: ["style", "class"] });

    const parentObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const removed of m.removedNodes) {
          if (removed === el) {
            document.body.appendChild(el);
            enforce();
          }
        }
      }
    });
    parentObserver.observe(document.body, { childList: true });

    return () => {
      observer.disconnect();
      parentObserver.disconnect();
    };
  }, []);

  const modal = (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.80)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{ position: "absolute", inset: 0 }}
        onClick={(e) => e.stopPropagation()}
      />

      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center"
        style={{ zIndex: 1 }}
      >
        <div className="text-5xl mb-4">🔧</div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Under Maintenance
        </h2>

        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {message || "We're currently performing scheduled maintenance. Please check back soon."}
        </p>

        <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl px-6 py-4">
          <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
            We apologize for the inconvenience.
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}