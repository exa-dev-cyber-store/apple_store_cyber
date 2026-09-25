import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const { token, password } = await req.json();

    if (!token || !token.trim()) {
      return NextResponse.json(
        { message: "Password reset token is required" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { message: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.API_ENDPOINT_USER || "https://be-apple-store.eka-dev.cloud/auth";
    const backendRes = await fetch(`${backendUrl}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.trim(), password }),
    });

    const resData = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: resData?.message || "Failed to reset password" },
        { status: backendRes.status || 400 }
      );
    }

    return NextResponse.json(resData);
  } catch (error: any) {
    console.error("Reset password API route error:", error);
    return NextResponse.json(
      { message: "Internal server error occurred while resetting password." },
      { status: 500 }
    );
  }
};
