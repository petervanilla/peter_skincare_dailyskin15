/**
 * Picked files go through a downscale before they reach IndexedDB — a modern
 * phone photo is 4–8MB, and the dashboard never renders it larger than the
 * card, so storing the original just wastes the origin's storage budget.
 */
const MAX_EDGE = 1400;
const QUALITY = 0.85;

export async function fileToDataUrl(file: File, maxEdge = MAX_EDGE): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));

  if (scale === 1 && file.type === "image/jpeg") {
    bitmap.close();
    return readAsDataUrl(file);
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return readAsDataUrl(file);
  }

  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", QUALITY);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
