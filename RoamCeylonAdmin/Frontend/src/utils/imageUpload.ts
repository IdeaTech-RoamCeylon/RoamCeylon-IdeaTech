// Helper to upload a local image URI through the NestJS backend to Nhost Storage.
// The backend proxies the upload with the admin secret (see rooms/hotels
// `uploadImage`), bypassing frontend storage permission issues.

const getApiUrl = () =>
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

async function uriToBase64(uri: string): Promise<string> {
  const fileRes = await fetch(uri);
  const blob = await fileRes.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip data:image/...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload a single local image URI and return its hosted URL.
 * If the URI is already an http(s) URL it is returned unchanged.
 *
 * @param uri       local file URI (or an existing http URL)
 * @param endpoint  backend upload endpoint, e.g. '/rooms/upload-image'
 * @param token     Nhost access token (Bearer)
 */
export async function uploadImage(
  uri: string,
  endpoint: string,
  token: string,
): Promise<string> {
  if (!uri || uri.startsWith('http')) return uri;

  const base64 = await uriToBase64(uri);
  const res = await fetch(`${getApiUrl()}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ base64, mimeType: 'image/jpeg' }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Image upload failed: ${errText}`);
  }

  const { url } = await res.json();
  return url as string;
}

/**
 * Upload a list of URIs (local or already-hosted) in order, returning the
 * resulting hosted URLs. Preserves order so the first item can be used as a
 * cover image.
 */
export async function uploadImages(
  uris: string[],
  endpoint: string,
  token: string,
): Promise<string[]> {
  const results: string[] = [];
  for (const uri of uris) {
    results.push(await uploadImage(uri, endpoint, token));
  }
  return results;
}
