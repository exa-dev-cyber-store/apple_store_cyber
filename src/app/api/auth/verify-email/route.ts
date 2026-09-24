import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/auth-cookies";

export const POST = async (req: NextRequest) => {
  try {
    const data = await req.json();
    const { email, code } = data;

    if (!email || !code) {
      return NextResponse.json(
        { message: "Email and 6-digit verification code are required" },
        { status: 400 }
      );
    }

    const backendRes = await fetch(`${process.env.API_ENDPOINT_USER}/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const resData = await backendRes.json();
    const payload = resData?.data || resData;

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: resData?.message || "Email verification failed" },
        { status: backendRes.status || 400 }
      );
    }

    const accessToken = payload.accessToken || payload.token;
    const refreshToken = payload.refreshToken;

    if (accessToken) {
      setAuthCookies(accessToken, refreshToken);
    }

    return NextResponse.json({
      success: true,
      message: resData?.message || "Email verified successfully",
      ...payload,
    });
  } catch (e: any) {
    const status = e.response?.status || 500;
    return NextResponse.json(
      { message: e.response?.data?.message || e.message || "Email verification failed" },
      { status }
    );
  }
};
