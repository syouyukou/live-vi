/** @typedef {"webm" | "mp4"} RecordFormat */

const MIME_CANDIDATES = {
  webm: ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"],
  mp4: ["video/mp4;codecs=avc1", "video/mp4;codecs=h264", "video/mp4"],
};

/** @param {RecordFormat} [format] @returns {string | null} */
export function pickRecorderMimeType(format = "webm") {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = MIME_CANDIDATES[format] ?? MIME_CANDIDATES.webm;
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return null;
}

/** @param {string | null | undefined} mime */
export function mimeIsMp4(mime) {
  return Boolean(mime && mime.includes("mp4"));
}

/** @param {string | null | undefined} mime */
export function outputExtensionForMime(mime) {
  return mimeIsMp4(mime) ? "mp4" : "webm";
}

/** @param {RecordFormat} format */
export function isRecordFormatSupported(format) {
  if (typeof HTMLCanvasElement === "undefined") return false;
  if (!("captureStream" in HTMLCanvasElement.prototype)) return false;
  if (format === "webm") return pickRecorderMimeType("webm") != null;
  return pickRecorderMimeType("mp4") != null || pickRecorderMimeType("webm") != null;
}

export class CanvasRecorder {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ fps?: number, format?: RecordFormat }} [options]
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.fps = options.fps ?? 30;
    /** @type {RecordFormat} */
    this.format = options.format ?? "webm";
    /** @type {MediaRecorder | null} */
    this.recorder = null;
    /** @type {Blob[]} */
    this.chunks = [];
    /** @type {string | null} */
    this.mimeType = null;
    /** @type {boolean} */
    this.willTranscode = false;
  }

  /** @param {RecordFormat} [format] */
  static isSupported(format = "webm") {
    return isRecordFormatSupported(format);
  }

  start() {
    const requested = this.format;
    let mimeType = pickRecorderMimeType(requested);
    this.willTranscode = false;

    if (!mimeType && requested === "mp4") {
      mimeType = pickRecorderMimeType("webm");
      this.willTranscode = mimeType != null;
    }

    if (!mimeType) {
      throw new Error("Video recording is not supported in this browser.");
    }

    const stream = this.canvas.captureStream(this.fps);
    this.chunks = [];
    this.mimeType = mimeType;
    this.recorder = new MediaRecorder(stream, { mimeType });
    this.recorder.ondataavailable = (e) => {
      if (e.data.size) this.chunks.push(e.data);
    };
    this.recorder.start(200);
    return true;
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.recorder) {
        resolve(null);
        return;
      }
      const mime = this.mimeType ?? "video/webm";
      const willTranscode = this.willTranscode;
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: mime });
        this.recorder = null;
        this.chunks = [];
        resolve(
          blob.size
            ? {
                blob,
                format: this.format,
                willTranscode,
                extension: willTranscode ? "mp4" : outputExtensionForMime(mime),
              }
            : null,
        );
      };
      this.recorder.stop();
    });
  }
}
