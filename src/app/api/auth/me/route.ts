import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const cookieStore = cookies();
    let token = cookieStore.get("jwt")?.value || cookieStore.get("token")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!token && !refreshToken) {
      return NextResponse.json({ success: true, user: null }, { status: 200 });
    }

    // Helper to fetch profile from backend
    const fetchMe = async (authToken: string) => {
      return await fetch(`${process.env.API_ENDPOINT_USER}/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
    };

    let backendRes = token ? await fetchMe(token) : null;

    // If access token is missing or expired, attempt transparent refresh using refresh token
    if ((!backendRes || backendRes.status === 401) && refreshToken) {
      const refreshRes = await fetch(`${process.env.API_ENDPOINT_USER}/refresh`, {
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
          backendRes = await fetchMe(newAccessToken);
        }
      } else {
        clearAuthCookies();
        return NextResponse.json({ success: true, user: null }, { status: 200 });
      }
    }

    if (!backendRes || !backendRes.ok) {
      clearAuthCookies();
      return NextResponse.json({ success: true, user: null }, { status: 200 });
    }

    const data = await backendRes.json();
    const user = data?.data?.user || data?.user || data?.data || data;

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
        image: user.avatar || null,
        signupProvider: user.signupProvider,
        authProviders: user.authProviders,
        googleId: user.googleId,
        appleId: user.appleId,
      },
    });
  } catch (error: any) {
    console.error("Auth me route error:", error);
    return NextResponse.json({ success: false, user: null }, { status: 200 });
  }
};

export const DELETE = async (req: NextRequest) => {
  try {
    const cookieStore = cookies();
    let token = cookieStore.get("jwt")?.value || cookieStore.get("token")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!token && !refreshToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    let bodyData: any = {};
    try {
      bodyData = await req.json();
    } catch {
      // Body optional
    }

    // Attempt token refresh if token expired
    const deleteAccountCall = async (authToken: string) => {
      return await fetch(`${process.env.API_ENDPOINT_USER}/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });
    };

    let backendRes = token ? await deleteAccountCall(token) : null;

    if ((!backendRes || backendRes.status === 401) && refreshToken) {
      const refreshRes = await fetch(`${process.env.API_ENDPOINT_USER}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const payload = refreshData?.data || refreshData;
        const newAccessToken = payload?.accessToken || payload?.token;
        if (newAccessToken) {
          backendRes = await deleteAccountCall(newAccessToken);
        }
      }
    }

    clearAuthCookies();

    if (!backendRes) {
      return NextResponse.json({ success: false, message: "Failed to connect to backend" }, { status: 500 });
    }

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    console.error("Auth delete account error:", error);
    clearAuthCookies();
    return NextResponse.json({ success: false, message: error.message || "Failed to delete account" }, { status: 500 });
  }
};

