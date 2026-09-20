import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const jwtToken = cookies().get("jwt")?.value;
    if (!jwtToken) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const backendUrl = process.env.API_ENDPOINT_USER || "http://localhost:5000/auth";
    const res = await fetch(`${backendUrl}/linked-accounts`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
      cache: "no-store",
    });

    const data = await res.json();
    if (res.status === 401) {
      cookies().delete("jwt");
      const response = NextResponse.json(data, { status: 401 });
      response.cookies.set("jwt", "", { path: "/", expires: new Date(0) });
      return response;
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("Fetch linked accounts error:", error);
    return NextResponse.json(
      { message: "Internal server error fetching linked accounts" },
      { status: 500 }
    );
  }
};
