export function getSafeExternalUrl(url: string | null): string | null {
  if (url === null) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' ? parsedUrl.href : null;
  } catch {
    return null;
  }
}
