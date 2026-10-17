"use client";

/**
 * Turns a picked photo into a small JPEG before it's sent. Phone photos are often 3 to 8 MB;
 * this brings them to a few hundred KB, which is plenty for a crew to see the problem.
 * Redrawing the image also drops its metadata, so a photo never carries your GPS position
 * or phone model to the city.
 */
const SIZES = [
  { edge: 1600, quality: 0.82 },
  { edge: 1200, quality: 0.7 },
  { edge: 900, quality: 0.6 },
];
const LIMIT = 1_000_000; // bytes, safely under the server's limit

export async function shrinkPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't a photo.");
  let bitmap: ImageBitmap;
  try {
    // Respects the orientation the phone recorded, so portrait photos stay upright.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Couldn't open that photo. Try a JPG or PNG.");
  }
  try {
    for (const { edge, quality } of SIZES) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d")!;
      // Transparent PNGs would turn black as JPEG.
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL("image/jpeg", quality);
      if (url.length * 0.75 <= LIMIT) return url;
    }
  } finally {
    bitmap.close();
  }
  throw new Error("That photo is too large.");
}
