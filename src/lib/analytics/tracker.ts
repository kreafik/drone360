const INGEST_URL = "/api/analytics/ingest";

type EventType =
  | "view_start"
  | "view_end"
  | "panorama_change"
  | "hotspot_click"
  | "fullscreen_enter"
  | "vr_enter";

let _sessionId: string | null = null;
let _sessionStart: number | null = null;
let _projectId: string | null = null;
let _shareId: string | null = null;

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function beacon(body: Record<string, unknown>) {
  if (typeof navigator === "undefined") return;
  const data = JSON.stringify(body);
  const blob = new Blob([data], { type: "application/json" });
  if (!navigator.sendBeacon(INGEST_URL, blob)) {
    fetch(INGEST_URL, {
      method: "POST",
      body: data,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }
}

export function startSession(
  projectId: string,
  shareId?: string | null,
  initialPanoramaId?: string | null
): () => void {
  if (typeof window === "undefined") return () => {};

  _sessionId = genId();
  _sessionStart = Date.now();
  _projectId = projectId;
  _shareId = shareId ?? null;

  beacon({
    eventType: "view_start",
    projectId,
    shareId: _shareId,
    sessionId: _sessionId,
    panoramaId: initialPanoramaId ?? null,
    referrer: document.referrer || null,
  });

  const handleVisibility = () => {
    if (document.visibilityState === "hidden") _flush();
  };
  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("beforeunload", _flush, { once: true });

  return () => {
    document.removeEventListener("visibilitychange", handleVisibility);
    _flush();
  };
}

function _flush() {
  if (!_sessionId || !_projectId || _sessionStart === null) return;
  const durationMs = Date.now() - _sessionStart;
  beacon({
    eventType: "view_end",
    projectId: _projectId,
    shareId: _shareId,
    sessionId: _sessionId,
    durationMs,
  });
  _sessionId = null;
  _sessionStart = null;
}

export function trackEvent(
  eventType: EventType,
  extras: Record<string, unknown> = {}
) {
  if (typeof window === "undefined" || !_sessionId || !_projectId) return;
  beacon({
    eventType,
    projectId: _projectId,
    shareId: _shareId,
    sessionId: _sessionId,
    ...extras,
  });
}
