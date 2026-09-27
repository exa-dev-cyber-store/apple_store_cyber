import { cookies } from "next/headers";
import { setAuthCookies, clearAuthCookies } from "./auth-cookies";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Server-side helper to retrieve a valid access token.
 * If the access token (jwt/token) is expired or deleted, but a valid refreshToken
 * cookie is present, it transparently requests a new access token from the backend,
 * updates the HTTP cookies, and returns the fresh access token.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("jwt")?.value || cookieStore.get("token")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (token) {
    return token;
  }

  if (!refreshToken) {
    return null;
  }

  return await refreshServerAccessToken(refreshToken);
}

/**
 * Directly invokes the backend /refresh endpoint using the given refreshToken
 * and persists the newly issued access & refresh tokens to cookies.
 */
export async function refreshServerAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const backendUrl = process.env.API_ENDPOINT_USER || "http://localhost:5000/auth";
    const refreshRes = await fetch(`${backendUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    if (!refreshRes.ok) {
      clearAuthCookies();
      return null;
    }

    const data = await refreshRes.json();
    const payload = data?.data || data;
    const newAccessToken = payload?.accessToken || payload?.token;
    const newRefreshToken = payload?.refreshToken;

    if (newAccessToken) {
      setAuthCookies(newAccessToken, newRefreshToken);
      return newAccessToken;
    }

    clearAuthCookies();
    return null;
  } catch (error) {
    console.error("Error refreshing server access token:", error);
    return null;
  }
}

/**
 * Executes a fetch request to the backend with Bearer authorization.
 * If access token is missing or if backend responds with 401, it attempts
 * a transparent refresh using the refreshToken cookie and retries the request once.
 */
export async function fetchWithAuth(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  let token = await getValidAccessToken();

  if (!token) {
    return new Response(
      JSON.stringify({ success: false, message: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  // If backend returns 401, attempt a single refresh and retry
  if (res.status === 401) {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;
    if (refreshToken) {
      const newToken = await refreshServerAccessToken(refreshToken);
      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
        res = await fetch(url, {
          ...init,
          headers,
          cache: "no-store",
        });
      }
    }
  }

  return res;
}
