import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = cookies().get("jwt")?.value || cookies().get("token")?.value;
    if (!token) {
      return NextResponse.json({
        success: true,
        data: { notifications: [], unreadCount: 0 }
      }, { status: 200 });
    }

    const backendUrl = process.env.API_ENDPOINT_DATA || "http://localhost:5000/api";
    const { searchParams } = new URL(req.url);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const res = await fetch(`${backendUrl}/notifications?${searchParams.toString()}`, {
      headers,
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
