import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const jwtToken = cookies().get("jwt")?.value;
    if (!jwtToken) {
      return NextResponse.json({ message: "Please sign in first" }, { status: 401 });
    }

    const body = await req.json();
    const { identityToken, token: inputToken, email } = body;
    const token = identityToken || inputToken;

    if (!token) {
      return NextResponse.json(
        { message: "Apple identity token is required" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.API_ENDPOINT_USER || "http://localhost:5000/auth";
    const backendRes = await fetch(`${backendUrl}/link/apple`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ identityToken: token, email }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok || !data.success) {
      return NextResponse.json(
        { message: data.message || "Failed to link Apple account", error: data },
        { status: backendRes.status || 400 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Link Apple route error:", error);
    return NextResponse.json(
      { message: "Internal server error while linking Apple account" },
      { status: 500 }
    );
  }
};
