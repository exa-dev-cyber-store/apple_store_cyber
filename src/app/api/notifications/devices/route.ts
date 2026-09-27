import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendUrl = process.env.API_ENDPOINT_DATA || "http://localhost:5000/api";

    const res = await fetchWithAuth(`${backendUrl}/notifications/devices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to register device" },
      { status: 500 }
    );
  }
}
