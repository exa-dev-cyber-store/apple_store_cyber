import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    let token = cookieStore.get("jwt")?.value || cookieStore.get("token")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!token && !refreshToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const backendDataUrl = process.env.API_ENDPOINT_DATA || "http://localhost:5000/api";
    const backendAuthUrl = process.env.API_ENDPOINT_USER || "http://localhost:5000/auth";

    // Helper to request SSE stream from backend
    const fetchStream = async (authToken: string) => {
      return await fetch(`${backendDataUrl}/notifications/stream`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "text/event-stream",
        },
        cache: "no-store",
      });
    };

    let backendRes = token ? await fetchStream(token) : null;

    // If access token is missing or expired (401), immediately refresh using refreshToken
    if ((!backendRes || backendRes.status === 401) && refreshToken) {
      try {
        const refreshRes = await fetch(`${backendAuthUrl}/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const payload = refreshData?.data || refreshData;
          const newAccessToken = payload?.accessToken || payload?.token;
          const newRefreshToken = payload?.refreshToken;

          if (newAccessToken) {
            setAuthCookies(newAccessToken, newRefreshToken);
            token = newAccessToken;
            backendRes = await fetchStream(newAccessToken);
          }
        } else {
          clearAuthCookies();
          return new NextResponse("Session expired", { status: 401 });
        }
      } catch (refreshErr) {
        console.error("[Notifications SSE Proxy] Refresh failed:", refreshErr);
      }
    }

    if (!backendRes || !backendRes.ok || !backendRes.body) {
      return new NextResponse("Backend notification stream unavailable", {
        status: backendRes?.status || 401,
      });
    }

    return new Response(backendRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    console.error("[Notifications SSE Proxy] Stream forwarding error:", error);
    return new NextResponse("Failed to connect to notification stream", {
      status: 500,
    });
  }
}
