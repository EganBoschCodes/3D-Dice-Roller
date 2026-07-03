"use client";

import { useEffect, useRef, useState } from "react";
import { loadSettings, saveSettings } from "@/lib/settings";
import { useDiceStore } from "@/lib/store";

export function Settings() {
  const suspense = useDiceStore((s) => s.suspense);
  const setSuspense = useDiceStore((s) => s.setSuspense);
  const blackFlash = useDiceStore((s) => s.blackFlash);
  const setBlackFlash = useDiceStore((s) => s.setBlackFlash);
  const bgMediaUrl = useDiceStore((s) => s.bgMediaUrl);
  const bgMediaType = useDiceStore((s) => s.bgMediaType);
  const setBackgroundMedia = useDiceStore((s) => s.setBackgroundMedia);
  const clearBackgroundMedia = useDiceStore((s) => s.clearBackgroundMedia);

  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const loaded = useRef(false);

  // localStorage is client-only; load after mount to avoid SSR hydration mismatch.
  useEffect(() => {
    const s = loadSettings();
    if (typeof s.suspense === "number") setSuspense(s.suspense);
    if (typeof s.blackFlash === "boolean") setBlackFlash(s.blackFlash);
    if (s.bgMediaUrl && s.bgMediaType) setBackgroundMedia(s.bgMediaUrl, s.bgMediaType);
    loaded.current = true;
  }, [setSuspense, setBlackFlash, setBackgroundMedia]);

  // Persist settings whenever they change (after initial load).
  useEffect(() => {
    if (!loaded.current) return;
    saveSettings({ suspense, blackFlash, bgMediaUrl, bgMediaType });
  }, [suspense, blackFlash, bgMediaUrl, bgMediaType]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith("video") ? "video" : "image";
    // Data URL (not an object URL) so it can be persisted to localStorage.
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setBackgroundMedia(reader.result, type);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // let the same file be re-picked later
  };

  return (
    <>
      <button
        className="settings-gear"
        onClick={() => setOpen((v) => !v)}
        aria-label="Settings"
        aria-expanded={open}
        title="Settings"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Zm7.4-2.06c.04-.3.06-.61.06-.94s-.02-.64-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7 7 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.24-1.12.56-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.44 8.34a.5.5 0 0 0 .12.64l2.03 1.58c-.04.3-.06.61-.06.94s.02.64.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.4.31.6.22l2.39-.96c.5.38 1.04.7 1.62.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.58-.24 1.12-.56 1.62-.94l2.39.96c.2.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58Z"
          />
        </svg>
      </button>

      {open && (
        <div className="settings-panel" role="dialog" aria-label="Settings">
          <div className="settings-header">
            <span className="settings-title">Settings</span>
            <button
              className="settings-close"
              onClick={() => setOpen(false)}
              aria-label="Close settings"
            >
              ×
            </button>
          </div>

          {/* Suspense */}
          <div className="settings-section">
            <label className="settings-label" htmlFor="suspense-range">
              Suspense
            </label>
            <input
              id="suspense-range"
              className="suspense-range"
              type="range"
              min={0}
              max={100}
              value={Math.round(suspense * 100)}
              onChange={(e) => setSuspense(Number(e.target.value) / 100)}
            />
            <div className="suspense-ends">
              <span>Snappy</span>
              <span>Chaos</span>
            </div>
          </div>

          {/* Tray background */}
          <div className="settings-section">
            <span className="settings-label">Tray background</span>
            <div className="settings-bg-controls">
              <button className="settings-btn" onClick={() => fileRef.current?.click()}>
                {bgMediaUrl ? "Replace…" : "Upload image / video"}
              </button>
              {bgMediaUrl && (
                <button className="settings-btn settings-btn-ghost" onClick={clearBackgroundMedia}>
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              onChange={onFile}
              style={{ display: "none" }}
            />
            {bgMediaUrl && (
              <div className="settings-bg-preview">
                {bgMediaType === "video" ? (
                  <video src={bgMediaUrl} muted loop autoPlay playsInline />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bgMediaUrl} alt="tray background preview" />
                )}
              </div>
            )}
            <p className="settings-hint">
              Shown as the felt floor the dice land on. Saved on this device
              (large videos may be too big to save).
            </p>
          </div>

          {/* Black flash */}
          <div className="settings-section">
            <label className="settings-check">
              <input
                type="checkbox"
                checked={blackFlash}
                onChange={(e) => setBlackFlash(e.target.checked)}
              />
              <span>
                Black flash
                <span className="settings-hint">
                  On a nat 20 result (advantage / disadvantage / flat d20).
                </span>
              </span>
            </label>
          </div>
        </div>
      )}
    </>
  );
}
