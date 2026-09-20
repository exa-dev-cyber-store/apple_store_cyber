import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/auth-cookies";

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { code, credential, token: inputToken } = body;
    const token = credential || inputToken;

    if (!code && !token) {
      return NextResponse.json(
        { message: "Google authorization code or credential token is required" },
        { status: 400 }
      );
    }

    // Forward code or credential to Backend for verification & token generation
    const backendRes = await fetch(`${process.env.API_ENDPOINT_USER}/google-auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...(code ? { code } : {}),
        ...(token ? { credential: token } : {}),
      }),
    });

    const data = await backendRes.json();
    const payload = data?.data || data;

    if (!backendRes.ok || (!payload?.token && !payload?.accessToken)) {
      return NextResponse.json(
        { message: data?.message || "Google authentication verification failed", error: data },
        { status: backendRes.status || 401 }
      );
    }

    const accessToken = payload.accessToken || payload.token;
    const refreshToken = payload.refreshToken;

    setAuthCookies(accessToken, refreshToken);

    const user = payload.user || {
      _id: payload._id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      avatar: payload.avatar || payload.picture || null,
      image: payload.avatar || payload.picture || null,
    };

    return NextResponse.json({
      success: true,
      data: user,
      user,
    });
  } catch (error: any) {
    console.error("Google auth route error:", error);
    return NextResponse.json(
      { message: "Internal server error during Google auth" },
      { status: 500 }
    );
  }
};
