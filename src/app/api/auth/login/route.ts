import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/auth-cookies";

export const POST = async (req: NextRequest) => {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const backendRes = await fetch(`${process.env.API_ENDPOINT_USER}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await backendRes.json();
    const payload = data?.data || data;

    if (!backendRes.ok || (!payload?.token && !payload?.accessToken)) {
      return NextResponse.json(
        { message: data?.message || "Invalid email or password" },
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
    console.error("Login API route error:", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error during login" },
      { status: 500 }
    );
  }
};
