import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH() {
  try {
    const token = cookies().get("jwt")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const backendUrl = process.env.API_ENDPOINT_DATA || "http://localhost:5000/api";
    const res = await fetch(`${backendUrl}/notifications/read-all`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}
