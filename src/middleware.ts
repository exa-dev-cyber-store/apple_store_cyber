import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function middleware(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get("jwt")?.value || cookieStore.get("token")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!token && !refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isProduction = process.env.NODE_ENV === "production";

  // Try validating access token
  if (token) {
    try {
      const res = await fetch(`${process.env.API_ENDPOINT_USER}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        return NextResponse.next();
      }
    } catch {
      // Network or backend error, try refresh fallback below
    }
  }

  // Fallback: If access token was missing or expired, attempt refresh via refreshToken
  if (refreshToken) {
    try {
      const refreshRes = await fetch(`${process.env.API_ENDPOINT_USER}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const payload = data?.data || data;
        const newAccessToken = payload?.accessToken || payload?.token;
        const newRefreshToken = payload?.refreshToken;

        if (newAccessToken) {
          const response = NextResponse.next();
          const accessExpires = new Date(Date.now() + 15 * 60 * 1000);
          response.cookies.set("jwt", newAccessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: "/",
            expires: accessExpires,
          });
          response.cookies.set("token", newAccessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: "/",
            expires: accessExpires,
          });
          if (newRefreshToken) {
            const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            response.cookies.set("refreshToken", newRefreshToken, {
              httpOnly: true,
              secure: isProduction,
              sameSite: "lax",
              path: "/",
              expires: refreshExpires,
            });
          }
          return response;
        }
      }
    } catch {
      // Refresh failed
    }
  }

  // If both access token and refresh failed
  const response = NextResponse.redirect(
    new URL("/login?session_expired=true", request.url)
  );
  const pastDate = new Date(0);
  response.cookies.set("jwt", "", { path: "/", expires: pastDate });
  response.cookies.set("token", "", { path: "/", expires: pastDate });
  response.cookies.set("refreshToken", "", { path: "/", expires: pastDate });
  return response;
}

export const config = {
  matcher: [
    "/account",
    "/account/:path*",
    "/cart",
    "/checkout/:path*",
    "/likes",
  ],
};