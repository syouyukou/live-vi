const STORAGE_KEY = "vi-composer-sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 180;
const MAX_WIDTH = 520;
const KEY_STEP = 16;

/** @param {HTMLElement} root */
function maxAllowedWidth(root) {
  const app = root.closest(".composer-app");
  if (!app) return MAX_WIDTH;
  return Math.min(MAX_WIDTH, Math.floor(app.clientWidth * 0.5));
}

/** @param {number} px */
function clampWidth(px, root) {
  return Math.round(Math.min(maxAllowedWidth(root), Math.max(MIN_WIDTH, px)));
}

/** @param {HTMLElement} handle */
function setWidth(handle, px) {
  const w = clampWidth(px, handle);
  document.documentElement.style.setProperty("--sidebar-width", `${w}px`);
  handle.setAttribute("aria-valuenow", String(w));
  return w;
}

/** @param {HTMLElement} handle */
export function initSidebarResize(handle) {
  if (!handle) return;

  const saved = Number(localStorage.getItem(STORAGE_KEY));
  const initial = Number.isFinite(saved) && saved >= MIN_WIDTH ? saved : DEFAULT_WIDTH;
  setWidth(handle, initial);

  const startDrag = (clientX) => {
    handle.classList.add("is-dragging");
    document.body.classList.add("composer-sidebar-resizing");

    const onMove = (e) => {
      setWidth(handle, e.clientX);
    };

    const onUp = () => {
      handle.classList.remove("is-dragging");
      document.body.classList.remove("composer-sidebar-resizing");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      const w = Number(handle.getAttribute("aria-valuenow"));
      if (Number.isFinite(w)) localStorage.setItem(STORAGE_KEY, String(w));
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  handle.addEventListener("pointerdown", (e) => {
    if (window.matchMedia("(max-width: 720px)").matches) return;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    startDrag(e.clientX);
  });

  handle.addEventListener("keydown", (e) => {
    if (window.matchMedia("(max-width: 720px)").matches) return;
    let delta = 0;
    if (e.key === "ArrowLeft") delta = -KEY_STEP;
    if (e.key === "ArrowRight") delta = KEY_STEP;
    if (!delta) return;
    e.preventDefault();
    const current = Number(handle.getAttribute("aria-valuenow")) || DEFAULT_WIDTH;
    const w = setWidth(handle, current + delta);
    localStorage.setItem(STORAGE_KEY, String(w));
  });

  window.addEventListener("resize", () => {
    const current = Number(handle.getAttribute("aria-valuenow")) || DEFAULT_WIDTH;
    setWidth(handle, current);
  });
}
