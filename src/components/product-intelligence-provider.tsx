"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackProductEvent, type ProductEventName, type ProductEventProperties } from "@/lib/product-intelligence";

function eventProperties(element: HTMLElement) {
  const properties: ProductEventProperties = {};
  Object.entries(element.dataset).forEach(([key, value]) => {
    if (!key.startsWith("track") || key === "trackEvent" || value === undefined) return;
    const property = key.replace(/^track/, "").replace(/^[A-Z]/, (letter) => letter.toLowerCase());
    properties[property] = value;
  });
  return properties;
}

export function ProductIntelligenceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const clickHistory = useRef(new Map<string, number[]>());

  useEffect(() => {
    trackProductEvent("page_viewed", { route_group: pathname.split("/").filter(Boolean)[0] ?? "home" });
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-track-event],[data-track-id]")
        : null;
      if (!target) return;

      const eventName = target.dataset.trackEvent as ProductEventName | undefined;
      if (eventName) trackProductEvent(eventName, eventProperties(target));

      const targetId = target.dataset.trackId;
      if (!targetId) return;
      const now = Date.now();
      const recent = (clickHistory.current.get(targetId) ?? []).filter((timestamp) => now - timestamp < 1800);
      recent.push(now);
      clickHistory.current.set(targetId, recent);
      if (recent.length === 3) {
        trackProductEvent("friction_detected", { kind: "repeated_click", target_id: targetId, click_count: recent.length });
      }
    }

    function onError() {
      trackProductEvent("app_error", { kind: "window_error" });
    }

    function onUnhandledRejection() {
      trackProductEvent("app_error", { kind: "unhandled_rejection" });
    }

    window.addEventListener("click", onClick, true);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigation) {
      trackProductEvent("performance_measured", {
        metric: "navigation",
        dom_content_loaded_ms: Math.round(navigation.domContentLoadedEventEnd),
        load_ms: Math.round(navigation.loadEventEnd),
      });
    }

    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return children;
}
