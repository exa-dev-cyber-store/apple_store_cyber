import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const jwtToken = cookies().get("jwt")?.value;
    if (!jwtToken) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const backendUrl = process.env.API_ENDPOINT_USER || "http://localhost:5000/auth";
    const res = await fetch(`${backendUrl}/me`, {
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
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { message: "Internal server error fetching profile" },
      { status: 500 }
    );
  }
};

export const PUT = async (req: NextRequest) => {
  try {
    const jwtToken = cookies().get("jwt")?.value;
    if (!jwtToken) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { message: "Full name is required" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.API_ENDPOINT_USER || "http://localhost:5000/auth";
    const res = await fetch(`${backendUrl}/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ name: name.trim() }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { message: "Internal server error updating profile" },
      { status: 500 }
    );
  }
};
