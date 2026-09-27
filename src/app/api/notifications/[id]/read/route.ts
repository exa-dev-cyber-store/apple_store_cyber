import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/server-auth";

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const backendUrl = process.env.API_ENDPOINT_DATA || "http://localhost:5000/api";
    const res = await fetchWithAuth(`${backendUrl}/notifications/${params.id}/read`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
