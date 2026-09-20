import { cookies } from "next/headers";

const isProduction = process.env.NODE_ENV === "production";

export const setAuthCookies = (accessToken: string, refreshToken?: string) => {
  const cookieStore = cookies();

  // Access token cookie (15 minutes)
  const accessExpires = new Date(Date.now() + 15 * 60 * 1000);
  cookieStore.set("jwt", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: accessExpires,
  });

  // Secondary alias for components reading "token"
  cookieStore.set("token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: accessExpires,
  });

  // Refresh token cookie (30 days)
  if (refreshToken) {
    const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      expires: refreshExpires,
    });
  }
};

export const clearAuthCookies = () => {
  const cookieStore = cookies();
  const pastDate = new Date(0);

  cookieStore.set("jwt", "", { path: "/", expires: pastDate });
  cookieStore.set("token", "", { path: "/", expires: pastDate });
  cookieStore.set("refreshToken", "", { path: "/", expires: pastDate });
  cookieStore.set("next-auth.session-token", "", { path: "/", expires: pastDate });
  cookieStore.set("__Secure-next-auth.session-token", "", { path: "/", expires: pastDate });
  cookieStore.set("next-auth.csrf-token", "", { path: "/", expires: pastDate });
};
