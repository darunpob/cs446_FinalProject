const MAX_EDGE_PX = 1280;
const JPEG_QUALITY = 0.82;
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))), "image/jpeg", JPEG_QUALITY);
  });
}

/** Shrinks camera photos before upload so S3 storage and mobile data stay small. */
export async function compressPhoto(source: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source);
  } catch (decodeError) {
    console.warn("Browser cannot decode this photo; uploading the original file", decodeError);
    return source;
  }
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return source;
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const compressed = await canvasToBlob(canvas);
  return compressed.size < source.size ? compressed : source;
}
