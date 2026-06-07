/** @type {Promise<{ ffmpeg: import("@ffmpeg/ffmpeg").FFmpeg, fetchFile: typeof import("@ffmpeg/util").fetchFile }> | null} */
let ffmpegLoadPromise = null;

async function loadFfmpeg() {
  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      const version = "0.12.10";
      const baseURL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${version}/dist/esm`;
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return { ffmpeg, fetchFile };
    })();
  }
  return ffmpegLoadPromise;
}

/**
 * @param {Blob} webmBlob
 * @returns {Promise<Blob>}
 */
export async function transcodeWebmToMp4(webmBlob) {
  const { ffmpeg, fetchFile } = await loadFfmpeg();
  const inputName = "input.webm";
  const outputName = "output.mp4";

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));
    await ffmpeg.exec([
      "-i",
      inputName,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outputName,
    ]);
    const data = await ffmpeg.readFile(outputName);
    return new Blob([data], { type: "video/mp4" });
  } finally {
    try {
      await ffmpeg.deleteFile(inputName);
    } catch {
      /* ignore */
    }
    try {
      await ffmpeg.deleteFile(outputName);
    } catch {
      /* ignore */
    }
  }
}
