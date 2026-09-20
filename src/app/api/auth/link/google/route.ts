import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const jwtToken = cookies().get("jwt")?.value;
    if (!jwtToken) {
      return NextResponse.json({ message: "Please sign in first" }, { status: 401 });
    }

    const body = await req.json();
    const { credential, token: inputToken } = body;
    const token = credential || inputToken;

    if (!token) {
      return NextResponse.json(
        { message: "Google credential token is required" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.API_ENDPOINT_USER || "http://localhost:5000/auth";
    const backendRes = await fetch(`${backendUrl}/link/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ credential: token }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok || !data.success) {
      return NextResponse.json(
        { message: data.message || "Failed to link Google account", error: data },
        { status: backendRes.status || 400 }
      );
    }

    // Set updated JWT session cookie with new email
    if (data.data?.token) {
      const expires = new Date();
      expires.setMonth(expires.getMonth() + 1);
      cookies().set("jwt", data.data.token, {
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        expires,
      });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Link Google route error:", error);
    return NextResponse.json(
      { message: "Internal server error while linking Google account" },
      { status: 500 }
    );
  }
};
