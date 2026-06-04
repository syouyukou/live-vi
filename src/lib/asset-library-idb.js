import {
  MAX_UNIT_ASSETS,
  UNIT_ASSET_KIND,
  hashSvgText,
} from "./asset-library.js";

const DB_NAME = "vi-composer-assets";
const DB_VERSION = 1;
const STORE = "assets";

/** @returns {Promise<IDBDatabase>} */
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("byKindLastUsed", ["kind", "lastUsedAt"]);
        store.createIndex("byKindHash", ["kind", "contentHash"]);
      }
    };
  });
}

/** @param {IDBDatabase} db @param {import("./asset-library.js").UploadedAsset} record */
function putRecord(db, record) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
    tx.objectStore(STORE).put(record);
  });
}

/** @param {IDBDatabase} db @param {string} id */
function deleteRecord(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB delete failed"));
    tx.objectStore(STORE).delete(id);
  });
}

/** @param {IDBDatabase} db */
async function pruneUnitAssets(db) {
  const all = await listUnitRecords(db);
  if (all.length <= MAX_UNIT_ASSETS) return;
  const excess = all
    .sort((a, b) => a.lastUsedAt - b.lastUsedAt)
    .slice(0, all.length - MAX_UNIT_ASSETS);
  for (const row of excess) {
    await deleteRecord(db, row.id);
  }
}

/** @param {IDBDatabase} db @returns {Promise<import("./asset-library.js").UploadedAsset[]>} */
function listUnitRecords(db) {
  return new Promise((resolve, reject) => {
    /** @type {import("./asset-library.js").UploadedAsset[]} */
    const rows = [];
    const tx = db.transaction(STORE, "readonly");
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB read failed"));
    const store = tx.objectStore(STORE);
    const index = store.index("byKindLastUsed");
    const range = IDBKeyRange.bound([UNIT_ASSET_KIND, 0], [UNIT_ASSET_KIND, Number.MAX_SAFE_INTEGER]);
    const req = index.openCursor(range, "prev");
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) {
        resolve(rows);
        return;
      }
      rows.push(/** @type {import("./asset-library.js").UploadedAsset} */ (cursor.value));
      cursor.continue();
    };
    req.onerror = () => reject(req.error ?? new Error("IndexedDB cursor failed"));
  });
}

/** @param {IDBDatabase} db @param {string} hash */
function findByHash(db, hash) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB read failed"));
    const index = tx.objectStore(STORE).index("byKindHash");
    const req = index.get([UNIT_ASSET_KIND, hash]);
    req.onsuccess = () => {
      resolve(/** @type {import("./asset-library.js").UploadedAsset | undefined} */ (req.result ?? undefined));
    };
    req.onerror = () => reject(req.error ?? new Error("IndexedDB lookup failed"));
  });
}

export function createUnitAssetLibrary() {
  return {
    /** @param {number} [limit] */
    async listRecent(limit = MAX_UNIT_ASSETS) {
      const db = await openDb();
      const rows = await listUnitRecords(db);
      db.close();
      return rows.slice(0, limit);
    },

    /** @param {import("./asset-library.js").SaveAssetInput} input */
    async save(input) {
      const db = await openDb();
      const contentHash = await hashSvgText(input.svgText);
      const now = Date.now();
      const existing = await findByHash(db, contentHash);
      if (existing) {
        existing.lastUsedAt = now;
        existing.displayName = input.displayName || existing.displayName;
        if (input.meta) existing.meta = { ...existing.meta, ...input.meta };
        await putRecord(db, existing);
        await pruneUnitAssets(db);
        db.close();
        return existing;
      }

      /** @type {import("./asset-library.js").UploadedAsset} */
      const record = {
        id: crypto.randomUUID(),
        kind: UNIT_ASSET_KIND,
        displayName: input.displayName,
        svgText: input.svgText,
        contentHash,
        byteSize: new TextEncoder().encode(input.svgText).length,
        createdAt: now,
        lastUsedAt: now,
        meta: input.meta,
      };
      await putRecord(db, record);
      await pruneUnitAssets(db);
      db.close();
      return record;
    },

    /** @param {string} id */
    async touch(id) {
      const db = await openDb();
      const row = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        tx.onerror = () => reject(tx.error ?? new Error("IndexedDB read failed"));
        const req = tx.objectStore(STORE).get(id);
        req.onsuccess = () => {
          resolve(/** @type {import("./asset-library.js").UploadedAsset | undefined} */ (req.result ?? undefined));
        };
        req.onerror = () => reject(req.error ?? new Error("IndexedDB get failed"));
      });
      if (row) {
        row.lastUsedAt = Date.now();
        await putRecord(db, row);
      }
      db.close();
    },
  };
}
