import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/server-auth";

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();

    const overrideNotification =
      req.headers.get("x-override-notification") ||
      process.env.MIDTRANS_OVERRIDE_NOTIFICATION_URL;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(overrideNotification
        ? { "x-override-notification": overrideNotification }
        : {}),
    };

    const response = await fetchWithAuth(
      `${process.env.API_ENDPOINT_DATA}/orders/charge`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }
    );

    const responseData = await response.json().catch(() => ({}));
    const payload = responseData?.data || responseData;
    return NextResponse.json({
      ...responseData,
      ...payload,
      status: payload?.status || responseData?.status || (responseData?.success ? "success" : "failed"),
      order: payload?.order || responseData?.order,
      charge: payload?.charge || responseData?.charge,
    }, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Failed to process Core API payment" },
      { status: 500 }
    );
  }
};
