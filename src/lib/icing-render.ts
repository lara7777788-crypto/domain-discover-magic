import type { SavePayload } from "@/components/SaveSheet";

type RenderableSticker = { emoji: string; x: number; y: number; size: number };

type RenderableIcingState = {
  hue: number;
  sat: number;
  bright: number;
  contrast: number;
  effect: string;
  stickers: RenderableSticker[];
};

const DOWNLOAD_FILENAME = "bake-a-cake-poster.png";

const EFFECT_CSS: Record<string, string> = {
  none: "",
  bw: "grayscale(1)",
  sepia: "sepia(0.85)",
  neon: "saturate(2) contrast(1.2) brightness(1.05)",
  vhs: "hue-rotate(-12deg) saturate(1.4) contrast(1.15)",
  riso: "contrast(1.3) saturate(1.5) hue-rotate(8deg)",
  holo: "hue-rotate(40deg) saturate(1.8) brightness(1.05)",
  noir: "grayscale(1) contrast(1.4) brightness(0.9)",
};

export function buildIcingFilter(s: RenderableIcingState) {
  const base = `hue-rotate(${s.hue}deg) saturate(${s.sat}%) brightness(${s.bright}%) contrast(${s.contrast}%)`;
  const eff = EFFECT_CSS[s.effect] ?? "";
  return [base, eff].filter(Boolean).join(" ");
}

function clamp(v: number) {
  return Math.max(0, Math.min(255, v));
}

function hueRotate(r: number, g: number, b: number, deg: number) {
  if (!deg) return [r, g, b] as const;
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [
    r * (0.213 + cos * 0.787 - sin * 0.213) + g * (0.715 - cos * 0.715 - sin * 0.715) + b * (0.072 - cos * 0.072 + sin * 0.928),
    r * (0.213 - cos * 0.213 + sin * 0.143) + g * (0.715 + cos * 0.285 + sin * 0.14) + b * (0.072 - cos * 0.072 - sin * 0.283),
    r * (0.213 - cos * 0.213 - sin * 0.787) + g * (0.715 - cos * 0.715 + sin * 0.715) + b * (0.072 + cos * 0.928 + sin * 0.072),
  ] as const;
}

function saturate(r: number, g: number, b: number, amount: number) {
  if (amount === 1) return [r, g, b] as const;
  return [
    r * (0.213 + 0.787 * amount) + g * (0.715 - 0.715 * amount) + b * (0.072 - 0.072 * amount),
    r * (0.213 - 0.213 * amount) + g * (0.715 + 0.285 * amount) + b * (0.072 - 0.072 * amount),
    r * (0.213 - 0.213 * amount) + g * (0.715 - 0.715 * amount) + b * (0.072 + 0.928 * amount),
  ] as const;
}

function grayscale(r: number, g: number, b: number, amount: number) {
  const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return [r * (1 - amount) + gray * amount, g * (1 - amount) + gray * amount, b * (1 - amount) + gray * amount] as const;
}

function sepia(r: number, g: number, b: number, amount: number) {
  const sr = r * 0.393 + g * 0.769 + b * 0.189;
  const sg = r * 0.349 + g * 0.686 + b * 0.168;
  const sb = r * 0.272 + g * 0.534 + b * 0.131;
  return [r * (1 - amount) + sr * amount, g * (1 - amount) + sg * amount, b * (1 - amount) + sb * amount] as const;
}

function brightness(r: number, g: number, b: number, amount: number) {
  return [r * amount, g * amount, b * amount] as const;
}

function contrast(r: number, g: number, b: number, amount: number) {
  return [(r - 128) * amount + 128, (g - 128) * amount + 128, (b - 128) * amount + 128] as const;
}

function applyEffect(r: number, g: number, b: number, effect: string) {
  switch (effect) {
    case "bw":
      return grayscale(r, g, b, 1);
    case "sepia":
      return sepia(r, g, b, 0.85);
    case "neon": {
      [r, g, b] = saturate(r, g, b, 2);
      [r, g, b] = contrast(r, g, b, 1.2);
      return brightness(r, g, b, 1.05);
    }
    case "vhs": {
      [r, g, b] = hueRotate(r, g, b, -12);
      [r, g, b] = saturate(r, g, b, 1.4);
      return contrast(r, g, b, 1.15);
    }
    case "riso": {
      [r, g, b] = contrast(r, g, b, 1.3);
      [r, g, b] = saturate(r, g, b, 1.5);
      return hueRotate(r, g, b, 8);
    }
    case "holo": {
      [r, g, b] = hueRotate(r, g, b, 40);
      [r, g, b] = saturate(r, g, b, 1.8);
      return brightness(r, g, b, 1.05);
    }
    case "noir": {
      [r, g, b] = grayscale(r, g, b, 1);
      [r, g, b] = contrast(r, g, b, 1.4);
      return brightness(r, g, b, 0.9);
    }
    default:
      return [r, g, b] as const;
  }
}

function applyIcingPixels(ctx: CanvasRenderingContext2D, w: number, h: number, icing: RenderableIcingState) {
  const image = ctx.getImageData(0, 0, w, h);
  const pixels = image.data;
  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i];
    let g = pixels[i + 1];
    let b = pixels[i + 2];

    [r, g, b] = hueRotate(r, g, b, icing.hue);
    [r, g, b] = saturate(r, g, b, icing.sat / 100);
    [r, g, b] = brightness(r, g, b, icing.bright / 100);
    [r, g, b] = contrast(r, g, b, icing.contrast / 100);
    [r, g, b] = applyEffect(r, g, b, icing.effect);

    pixels[i] = clamp(r);
    pixels[i + 1] = clamp(g);
    pixels[i + 2] = clamp(b);
  }
  ctx.putImageData(image, 0, 0);
}

function drawStickers(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  icing: RenderableIcingState,
  referenceWidth: number,
) {
  for (const s of icing.stickers) {
    const x = (s.x / 100) * w;
    const y = (s.y / 100) * h;
    const px = s.size * (w / referenceWidth);
    ctx.font = `${px}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = px * 0.15;
    ctx.shadowOffsetY = px * 0.06;
    ctx.fillText(s.emoji, x, y);
  }
}

function dataUrlToBlob(dataUrl: string) {
  const [meta = "", data = ""] = dataUrl.split(",");
  const mime = meta.match(/data:([^;]+)/)?.[1] ?? "image/png";
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return dataUrlToBlob(canvas.toDataURL("image/png"));
}

function drawIcedImage(
  img: HTMLImageElement,
  icing: RenderableIcingState,
  referenceWidth: number,
) {
  const w = img.naturalWidth || 1024;
  const h = img.naturalHeight || 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't prepare the PNG.");

  ctx.drawImage(img, 0, 0, w, h);
  applyIcingPixels(ctx, w, h, icing);
  drawStickers(ctx, w, h, icing, referenceWidth);
  return canvas;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image_load_failed"));
    img.src = src;
  });
}

export async function renderIcedImageToDataUrl(imageUrl: string, icing: RenderableIcingState) {
  const img = await loadImg(imageUrl);
  return drawIcedImage(img, icing, 1024).toDataURL("image/png");
}

export function renderIcedStageToPayload(
  stage: HTMLDivElement | null,
  icing: RenderableIcingState,
): SavePayload & { blob: Blob } {
  if (!stage) throw new Error("The slice is not ready yet. Try Download again in a moment.");
  const img = stage.querySelector("img");
  if (!img?.complete) throw new Error("Image is still loading. Try Download again in a moment.");

  const rect = stage.getBoundingClientRect();
  const referenceWidth = rect.width || img.naturalWidth || 1024;
  const canvas = drawIcedImage(img, icing, referenceWidth);
  const blob = canvasToBlob(canvas);
  return { url: URL.createObjectURL(blob), blob, filename: DOWNLOAD_FILENAME };
}