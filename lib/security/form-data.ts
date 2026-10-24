/** Enforce a byte cap before the multipart parser buffers the request. */
export async function readFormDataLimited(req: Request, maxBytes: number): Promise<FormData> {
  if (!req.body) throw new Error("Request body is required");
  const declared = Number(req.headers.get("content-length"));
  if (declared > maxBytes) throw new Error("Upload is too large");
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        throw new Error("Upload is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bounded = new Request(req.url, {
    method: req.method,
    headers: req.headers,
    body: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), size),
  });
  return bounded.formData();
}
