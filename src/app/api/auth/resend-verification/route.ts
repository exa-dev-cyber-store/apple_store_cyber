import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const data = await req.json();
    const { email } = data;

    if (!email) {
      return NextResponse.json(
        { message: "Email address is required" },
        { status: 400 }
      );
    }

    const backendRes = await fetch(`${process.env.API_ENDPOINT_USER}/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const resData = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: resData?.message || "Failed to resend verification code" },
        { status: backendRes.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: resData?.message || "Verification code sent successfully",
      ...resData,
    });
  } catch (e: any) {
    const status = e.response?.status || 500;
    return NextResponse.json(
      { message: e.response?.data?.message || e.message || "Failed to resend verification code" },
      { status }
    );
  }
};
