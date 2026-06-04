/** @param {number} v */
export function formatNum(v) {
  const a = Math.abs(v);
  if (a >= 100) return v.toFixed(1);
  if (a >= 10) return v.toFixed(2);
  if (a >= 1) return v.toFixed(2);
  return v.toFixed(2);
}

/**
 * @param {string} baseId
 * @param {{ get: () => number, set: (n: number) => void, toDisplay?: (n: number) => number, fromDisplay?: (n: number) => number }} spec
 * @param {() => void} [onChange]
 */
export function bindSliderPair(baseId, spec, onChange) {
  const slider = document.getElementById(`${baseId}-slider`);
  const num = document.getElementById(`${baseId}-num`);
  if (!slider || !num) return;

  const toDisplay = spec.toDisplay ?? ((n) => n);
  const fromDisplay = spec.fromDisplay ?? ((n) => n);

  const syncFromParams = () => {
    const d = toDisplay(spec.get());
    slider.value = String(d);
    num.value = formatNum(d);
  };

  const apply = (displayVal) => {
    const d = Number(displayVal);
    if (Number.isNaN(d)) return;
    spec.set(fromDisplay(d));
    slider.value = String(d);
    num.value = formatNum(d);
    onChange?.();
  };

  slider.addEventListener("input", (e) => apply(e.target.value));
  num.addEventListener("change", (e) => apply(e.target.value));
  num.addEventListener("input", (e) => apply(e.target.value));

  return { syncFromParams };
}

/**
 * @param {string} baseId e.g. "el-fill" → #el-fill-color
 * @param {{ get: () => string, set: (hex: string) => void }} spec
 * @param {() => void} [onChange]
 */
export function bindColorPair(baseId, spec, onChange) {
  const color = document.getElementById(`${baseId}-color`);
  if (!color) return;

  const syncFromParams = () => {
    color.value = spec.get();
  };

  const apply = (raw) => {
    let h = String(raw).trim();
    if (!h.startsWith("#")) h = `#${h}`;
    if (!/^#[0-9A-Fa-f]{6}$/i.test(h)) return;
    h = h.toLowerCase();
    spec.set(h);
    color.value = h;
    onChange?.();
  };

  color.addEventListener("input", (e) => apply(e.target.value));

  return { syncFromParams };
}
