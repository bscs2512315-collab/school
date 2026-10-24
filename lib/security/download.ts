/** Download only from configured, trusted HTTPS hosts, including redirects. */
export async function downloadTrustedFile(
  rawUrl: string,
  options: { allowedHosts: readonly string[]; allowedPathPrefix?: string; maxBytes: number; timeoutMs: number; accept: string },
): Promise<Buffer> {
  const hosts = new Set(options.allowedHosts.map((host) => host.toLowerCase().trim()).filter(Boolean));
  if (hosts.size === 0) throw new Error("No trusted download hosts are configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    let current = rawUrl;
    for (let redirect = 0; redirect <= 3; redirect++) {
      const url = new URL(current);
      if (url.protocol !== "https:" || !hosts.has(url.hostname.toLowerCase()) || url.username || url.password || url.port) {
        throw new Error("Download URL is not an approved HTTPS destination");
      }
      if (options.allowedPathPrefix && !url.pathname.startsWith(options.allowedPathPrefix)) {
        throw new Error("Download path is not approved");
      }
      const response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { Accept: options.accept },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) throw new Error("Invalid download redirect");
        current = new URL(location, url).toString();
        await response.body?.cancel();
        continue;
      }
      if (!response.ok || !response.body) throw new Error("Could not download file");
      const declaredSize = Number(response.headers.get("content-length"));
      if (declaredSize > options.maxBytes) throw new Error("File exceeds maximum size");
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          length += value.byteLength;
          if (length > options.maxBytes) {
            await reader.cancel();
            throw new Error("File exceeds maximum size");
          }
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
      return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), length);
    }
    throw new Error("Too many download redirects");
  } finally {
    clearTimeout(timer);
  }
}
