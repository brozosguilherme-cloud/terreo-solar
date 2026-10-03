/** Reduz a foto para no máximo `maxSize` px no maior lado e reencoda em JPEG. */
export async function downscaleDataUrl(dataUrl: string, maxSize = 1440, quality = 0.8): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  if (scale === 1 && dataUrl.startsWith('data:image/jpeg') && dataUrl.length < 900_000) return dataUrl;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}
