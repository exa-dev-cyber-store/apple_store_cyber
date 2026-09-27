import { NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/server-auth";

export async function PATCH() {
  try {
    const backendUrl = process.env.API_ENDPOINT_DATA || "http://localhost:5000/api";
    const res = await fetchWithAuth(`${backendUrl}/notifications/read-all`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}
