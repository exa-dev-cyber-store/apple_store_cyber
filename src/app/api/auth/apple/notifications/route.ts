import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let body: any;

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      const obj: Record<string, any> = {};
      formData.forEach((val, key) => {
        obj[key] = val;
      });
      body = obj;
    } else {
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { payload: text };
      }
    }

    const backendUrl = process.env.API_ENDPOINT_USER || "http://localhost:5000/auth";
    const res = await fetch(`${backendUrl}/apple/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data, { status: res.status || 200 });
  } catch (error: any) {
    console.error("[Next.js Proxy] Apple notification error:", error);
    return NextResponse.json({ success: true, message: "Handled" }, { status: 200 });
  }
}
