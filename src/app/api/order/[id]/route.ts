import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/server-auth";

export const GET = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const res = await fetchWithAuth(
      `${process.env.API_ENDPOINT_DATA}/orders/${id}`,
      { method: "GET" }
    );

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Failed to fetch order details" },
      { status: 500 }
    );
  }
};
