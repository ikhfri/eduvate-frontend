/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
interface FetchApiOptions extends RequestInit {
  token?: string | null;
  body?: any; 
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
      errorData = { message: response.statusText };
    }
    const error = new Error(
      errorData.message || `Request failed with status ${response.status}`
    ) as any;
    error.response = response; 
    error.data = errorData; 
    throw error;
  }

  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return undefined;
  }

  return response.json();
}
