const MARKUP = /<\s*\/?\s*[a-z!]/i;

/** An `<img src>` for an API image string. HTML is rejected. Nothing here
 *  assigns `innerHTML`. */
export function assetImageSrc(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || MARKUP.test(trimmed)) return null;
  if (trimmed.startsWith('data:image/')) return trimmed;
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) return trimmed;
  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed)) return `data:image/png;base64,${trimmed.replace(/\s/g, '')}`;
  return null;
}
