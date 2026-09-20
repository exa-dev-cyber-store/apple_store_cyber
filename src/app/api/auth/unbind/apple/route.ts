import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const POST = async () => {
  try {
    const jwtToken = cookies().get("jwt")?.value;
    if (!jwtToken) {
      return NextResponse.json({ message: "Please sign in first" }, { status: 401 });
    }

    const backendUrl = process.env.API_ENDPOINT_USER || "http://localhost:5000/auth";
    const backendRes = await fetch(`${backendUrl}/unbind/apple`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    const data = await backendRes.json();

    if (!backendRes.ok || !data.success) {
      return NextResponse.json(
        { message: data.message || "Failed to disconnect Apple account", error: data },
        { status: backendRes.status || 400 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Unbind Apple route error:", error);
    return NextResponse.json(
      { message: "Internal server error while disconnecting Apple account" },
      { status: 500 }
    );
  }
};
