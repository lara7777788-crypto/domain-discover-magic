/**
 * Downscale a large base64 image data URL into a small tile-sized thumbnail.
 * Gallery rows store these so the archive never has to pull multi-megabyte
 * previews just to render a grid.
 */
export async function makeThumb(dataUrl: string, size = 480): Promise<string | null> {
  if (typeof document === "undefined" || !dataUrl?.startsWith("data:image")) return null;
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode failed"));
      img.src = dataUrl;
    });
    const w = img.width || size;
    const h = img.height || size;
    const scale = Math.min(1, size / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = canvas.toDataURL("image/webp", 0.8);
    return out.startsWith("data:image/webp") ? out : canvas.toDataURL("image/jpeg", 0.8);
  } catch {
    return null;
  }
}
