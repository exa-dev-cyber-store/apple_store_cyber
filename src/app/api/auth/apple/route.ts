import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/auth-cookies";

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { identityToken, token: inputToken, email, name } = body;
    const token = identityToken || inputToken;

    if (!token) {
      return NextResponse.json(
        { message: "Apple identityToken is required" },
        { status: 400 }
      );
    }

    const backendRes = await fetch(`${process.env.API_ENDPOINT_USER}/apple-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identityToken: token,
        email,
        name,
      }),
    });

    const data = await backendRes.json();
    const payload = data?.data || data;

    if (!backendRes.ok || (!payload?.token && !payload?.accessToken)) {
      return NextResponse.json(
        { message: data?.message || "Apple authentication failed" },
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
      avatar: payload.avatar || null,
      image: payload.avatar || null,
    };

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error("Apple auth API route error:", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error during Apple auth" },
      { status: 500 }
    );
  }
};
