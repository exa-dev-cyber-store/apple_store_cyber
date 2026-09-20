import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth-cookies";

export const POST = async (req: NextRequest) => {
  try {
    const cookieStore = cookies();
    const refreshToken =
      cookieStore.get("refreshToken")?.value || (await req.json().catch(() => ({})))?.refreshToken;

    if (!refreshToken) {
      clearAuthCookies();
      return NextResponse.json(
        { message: "No refresh token available" },
        { status: 401 }
      );
    }

    const backendRes = await fetch(`${process.env.API_ENDPOINT_USER}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await backendRes.json();
    const payload = data?.data || data;

    if (!backendRes.ok || (!payload?.accessToken && !payload?.token)) {
      clearAuthCookies();
      return NextResponse.json(
        { message: data?.message || "Failed to refresh token" },
        { status: backendRes.status || 401 }
      );
    }

    const accessToken = payload.accessToken || payload.token;
    const newRefreshToken = payload.refreshToken;

    setAuthCookies(accessToken, newRefreshToken);

    return NextResponse.json({
      success: true,
      accessToken,
      user: payload.user || null,
    });
  } catch (error: any) {
    console.error("Refresh route error:", error);
    clearAuthCookies();
    return NextResponse.json(
      { message: error?.message || "Internal server error during refresh" },
      { status: 500 }
    );
  }
};
