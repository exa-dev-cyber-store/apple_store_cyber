import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const backendUrl = process.env.API_ENDPOINT_USER || "http://localhost:5000/auth";
    const res = await fetchWithAuth(`${backendUrl}/me`, {
      method: "GET",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { message: "Internal server error fetching profile" },
      { status: 500 }
    );
  }
};

export const PUT = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { message: "Full name is required" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.API_ENDPOINT_USER || "http://localhost:5000/auth";
    const res = await fetchWithAuth(`${backendUrl}/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: name.trim() }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { message: "Internal server error updating profile" },
      { status: 500 }
    );
  }
};
