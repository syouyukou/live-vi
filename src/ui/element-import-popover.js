import { formatLabel, UI_STRINGS } from "./i18n.js";

/**
 * @param {{
 *   anchor: HTMLElement,
 *   fileInput: HTMLInputElement,
 *   library: ReturnType<import("../lib/asset-library-idb.js").createUnitAssetLibrary>,
 *   onApply: (svgText: string, displayName: string) => boolean | void | Promise<boolean | void>,
 *   getLang: () => import("./i18n.js").UiLang,
 * }} opts
 */
export function initElementImportPopover(opts) {
  const { anchor, fileInput, library, onApply, getLang } = opts;

  const popover = document.createElement("div");
  popover.className = "composer-import-popover hidden";
  popover.setAttribute("role", "dialog");
  popover.setAttribute("aria-modal", "false");
  popover.id = "element-import-popover";

  const title = document.createElement("p");
  title.className = "composer-import-popover-title";
  title.setAttribute("data-i18n", "section.recentElements");

  const list = document.createElement("ul");
  list.className = "composer-import-popover-list";
  list.setAttribute("role", "listbox");

  const empty = document.createElement("p");
  empty.className = "composer-import-popover-empty hidden";
  empty.setAttribute("data-i18n", "hint.noRecentElements");

  const pickNew = document.createElement("button");
  pickNew.type = "button";
  pickNew.className = "composer-import-popover-pick";
  pickNew.setAttribute("data-i18n", "action.pickNewElementFile");

  popover.append(title, list, empty, pickNew);
  document.body.append(popover);

  let open = false;

  function syncPopoverI18n() {
    const lang = getLang();
    for (const el of popover.querySelectorAll("[data-i18n]")) {
      const key = el.getAttribute("data-i18n");
      const entry = key && UI_STRINGS[key];
      if (entry) el.textContent = formatLabel(entry, lang);
    }
  }

  function positionPopover() {
    const rect = anchor.getBoundingClientRect();
    const margin = 6;
    popover.style.left = `${Math.max(8, rect.left)}px`;
    popover.style.top = `${rect.bottom + margin}px`;
    const maxW = Math.min(280, window.innerWidth - 16);
    popover.style.width = `${Math.max(rect.width, maxW)}px`;
    popover.style.maxWidth = `${window.innerWidth - 16}px`;
  }

  function closePopover() {
    open = false;
    popover.classList.add("hidden");
    anchor.setAttribute("aria-expanded", "false");
  }

  /** @param {import("../lib/asset-library.js").UploadedAsset} asset */
  function previewDataUrl(asset) {
    const trimmed = asset.svgText.trim();
    if (!trimmed) return null;
    return `data:image/svg+xml,${encodeURIComponent(trimmed)}`;
  }

  /** @param {import("../lib/asset-library.js").UploadedAsset[]} assets */
  function renderList(assets) {
    list.replaceChildren();
    empty.classList.toggle("hidden", assets.length > 0);
    list.classList.toggle("hidden", assets.length === 0);

    for (const asset of assets) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "composer-import-popover-item";
      btn.setAttribute("role", "option");

      const thumb = document.createElement("span");
      thumb.className = "composer-import-popover-thumb";
      const src = previewDataUrl(asset);
      if (src) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.width = 28;
        img.height = 28;
        img.loading = "lazy";
        thumb.append(img);
      }

      const label = document.createElement("span");
      label.className = "composer-import-popover-name";
      label.textContent = asset.displayName;

      btn.append(thumb, label);
      btn.addEventListener("click", async () => {
        const ok = await onApply(asset.svgText, asset.displayName);
        if (ok !== false) {
          void library.touch(asset.id);
          closePopover();
        }
      });

      li.append(btn);
      list.append(li);
    }

    syncPopoverI18n();
  }

  async function openPopover() {
    open = true;
    syncPopoverI18n();
    positionPopover();
    popover.classList.remove("hidden");
    anchor.setAttribute("aria-expanded", "true");
    try {
      renderList(await library.listRecent());
    } catch (err) {
      console.error("[element-import-popover]", err);
      renderList([]);
    }
  }

  anchor.setAttribute("aria-haspopup", "listbox");
  anchor.setAttribute("aria-expanded", "false");
  anchor.setAttribute("aria-controls", popover.id);

  anchor.addEventListener("click", () => {
    if (open) {
      closePopover();
      return;
    }
    void openPopover();
  });

  pickNew.addEventListener("click", () => {
    closePopover();
    fileInput.click();
  });

  fileInput.addEventListener(
    "change",
    () => {
      closePopover();
    },
    { capture: true },
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) closePopover();
  });

  document.addEventListener(
    "mousedown",
    (e) => {
      if (!open) return;
      const t = /** @type {Node} */ (e.target);
      if (popover.contains(t) || anchor.contains(t)) return;
      closePopover();
    },
    true,
  );

  window.addEventListener("resize", () => {
    if (open) positionPopover();
  });

  return {
    close: closePopover,
    refreshI18n: syncPopoverI18n,
  };
}
