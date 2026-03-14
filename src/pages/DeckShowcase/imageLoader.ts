const cache = new Map<string, HTMLImageElement>();

export async function loadImage(url: string): Promise<HTMLImageElement> {
  if (cache.has(url)) return cache.get(url)!;

  let src: string;
  if (url.startsWith("data:")) {
    src = url;
  } else {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    src = URL.createObjectURL(await resp.blob());
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { cache.set(url, img); resolve(img); };
    img.onerror = reject;
    img.src = src;
  });
}
