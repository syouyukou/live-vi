/** @typedef {"unit"} AssetKind */

/**
 * @typedef {object} UploadedAsset
 * @property {string} id
 * @property {AssetKind} kind
 * @property {string} displayName
 * @property {string} svgText
 * @property {string} contentHash
 * @property {number} byteSize
 * @property {number} createdAt
 * @property {number} lastUsedAt
 * @property {{ fillColor?: string; outlineColor?: string; parseOk?: boolean } | undefined} [meta]
 */

/** @typedef {Pick<UploadedAsset, "displayName" | "svgText" | "meta">} SaveAssetInput */

export const UNIT_ASSET_KIND = /** @type {const} */ ("unit");
export const MAX_UNIT_ASSETS = 30;

/**
 * @param {string} svgText
 * @returns {Promise<string>}
 */
export async function hashSvgText(svgText) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(svgText));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
