const MIME_CANDIDATES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];

/** @returns {string | null} */
export function pickRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  for (const mime of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return null;
}

export class CanvasRecorder {
  /** @param {HTMLCanvasElement} canvas @param {number} [fps] */
  constructor(canvas, fps = 30) {
    this.canvas = canvas;
    this.fps = fps;
    /** @type {MediaRecorder | null} */
    this.recorder = null;
    /** @type {Blob[]} */
    this.chunks = [];
    /** @type {string | null} */
    this.mimeType = null;
  }

  static isSupported() {
    return (
      typeof HTMLCanvasElement !== "undefined" &&
      "captureStream" in HTMLCanvasElement.prototype &&
      pickRecorderMimeType() != null
    );
  }

  start() {
    const mimeType = pickRecorderMimeType();
    if (!mimeType) throw new Error("WebM recording is not supported in this browser.");

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
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: mime });
        this.recorder = null;
        this.chunks = [];
        resolve(blob.size ? blob : null);
      };
      this.recorder.stop();
    });
  }
}
