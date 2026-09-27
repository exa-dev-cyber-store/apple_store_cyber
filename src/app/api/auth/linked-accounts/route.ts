import { NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const backendUrl = process.env.API_ENDPOINT_USER || "http://localhost:5000/auth";
    const res = await fetchWithAuth(`${backendUrl}/linked-accounts`, {
      method: "GET",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("Fetch linked accounts error:", error);
    return NextResponse.json(
      { message: "Internal server error fetching linked accounts" },
      { status: 500 }
    );
  }
};
