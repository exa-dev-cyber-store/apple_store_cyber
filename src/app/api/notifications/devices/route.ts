import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const token = cookies().get("jwt")?.value || cookies().get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required to register device" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const backendUrl = process.env.API_ENDPOINT_DATA || "http://localhost:5000/api";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const res = await fetch(`${backendUrl}/notifications/devices`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to register device" },
      { status: 500 }
    );
  }
}
