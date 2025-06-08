/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
interface FetchApiOptions extends RequestInit {
  token?: string | null;
  body?: any; // Bisa FormData atau objek JSON
}

export async function fetchApi(
  endpoint: string,
  options: FetchApiOptions = {}
) {
  const { token, body, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});

  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }

  // Hanya set Content-Type jika body bukan FormData
  // Fetch akan otomatis set Content-Type untuk FormData
  if (body && !(body instanceof FormData)) {
    headers.append("Content-Type", "application/json");
  }

  const config: RequestInit = {
    ...fetchOptions,
    headers,
  };

  if (body) {
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  const response = await fetch(`${baseUrl}${endpoint}`, config);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // Jika respons bukan JSON, gunakan statusText
      errorData = { message: response.statusText };
    }
    // Buat error yang lebih informatif
    const error = new Error(
      errorData.message || `Request failed with status ${response.status}`
    ) as any;
    error.response = response; // Lampirkan seluruh objek response
    error.data = errorData; // Lampirkan data error jika ada
    throw error;
  }

  // Jika respons tidak memiliki body (misalnya 204 No Content)
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return undefined;
  }

  return response.json();
}
