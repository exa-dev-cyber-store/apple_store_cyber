import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { message: "Email address is required" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.API_ENDPOINT_USER || "https://be-apple-store.eka-dev.cloud/auth";
    const backendRes = await fetch(`${backendUrl}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    const resData = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: resData?.message || "Failed to process forgot password request" },
        { status: backendRes.status || 400 }
      );
    }

    return NextResponse.json(resData);
  } catch (error: any) {
    console.error("Forgot password API route error:", error);
    return NextResponse.json(
      { message: "Internal server error occurred while processing forgot password." },
      { status: 500 }
    );
  }
};
