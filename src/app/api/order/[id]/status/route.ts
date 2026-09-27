import { fetchWithAuth } from "@/lib/server-auth";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const response = await fetchWithAuth(
      `${process.env.API_ENDPOINT_DATA}/orders/${id}/status`
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Order status check error:", error.message);
    return NextResponse.json(
      { message: "Failed to fetch order payment status" },
      { status: 500 }
    );
  }
};
