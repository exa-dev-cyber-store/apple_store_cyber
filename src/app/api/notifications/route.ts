import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth, getValidAccessToken } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const token = await getValidAccessToken();
    if (!token) {
      return NextResponse.json({
        success: true,
        data: { notifications: [], unreadCount: 0 }
      }, { status: 200 });
    }

    const backendUrl = process.env.API_ENDPOINT_DATA || "http://localhost:5000/api";
    const { searchParams } = new URL(req.url);

    const res = await fetchWithAuth(`${backendUrl}/notifications?${searchParams.toString()}`, {
      headers: {
        "Content-Type": "application/json",
      },
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
