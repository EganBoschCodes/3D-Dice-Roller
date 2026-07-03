// User preferences persisted to localStorage, including the uploaded tray
// background stored as a data URL. Large videos can exceed the storage quota;
// saveSettings swallows that (the media still works for the session, it just
// won't survive a reload).
import type { BgMediaType } from "./store";

export interface PersistedSettings {
  suspense: number;
  blackFlash: boolean;
  bgMediaUrl: string | null;
  bgMediaType: BgMediaType | null;
}

const KEY = "dnd-dice-settings";

/** Reads localStorage; returns {} on the server or on any parse/storage error. */
export function loadSettings(): Partial<PersistedSettings> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Partial<PersistedSettings> = {};
    if (typeof parsed.suspense === "number") out.suspense = parsed.suspense;
    if (typeof parsed.blackFlash === "boolean") out.blackFlash = parsed.blackFlash;
    if (typeof parsed.bgMediaUrl === "string") out.bgMediaUrl = parsed.bgMediaUrl;
    if (parsed.bgMediaType === "image" || parsed.bgMediaType === "video") {
      out.bgMediaType = parsed.bgMediaType;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveSettings(s: PersistedSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage full or unavailable — nothing we can meaningfully do
  }
}
