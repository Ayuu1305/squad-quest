/**
 * Compresses an image string (base64) to be under a certain size limit.
 * @param {string} base64Str - The original base64 image string.
 * @param {number} maxWidth - Max width of the resulting image.
 * @param {number} quality - Compression quality (0 to 1).
 * @returns {Promise<string>} - Compressed base64 string.
 */
export const compressImage = (base64Str, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = maxWidth / img.width;

      // Only scale down if it's wider than maxWidth
      const width = img.width > maxWidth ? maxWidth : img.width;
      const height = img.width > maxWidth ? img.height * scale : img.height;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to compressed jpeg
      const compressedData = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedData);
    };
  });
};
