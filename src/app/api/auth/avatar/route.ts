import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const POST = async (req: NextRequest) => {
  try {
    const jwtToken = cookies().get("jwt")?.value;
    if (!jwtToken) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const avatarFile = formData.get("avatar");
    if (!avatarFile) {
      return NextResponse.json({ message: "Avatar file is required" }, { status: 400 });
    }

    const backendUrl = process.env.API_ENDPOINT_USER || "http://localhost:5000/auth";

    // Reconstruct FormData to send to backend
    const backendFormData = new FormData();
    backendFormData.append("avatar", avatarFile);

    const res = await fetch(`${backendUrl}/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
      body: backendFormData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("Avatar upload proxy error:", error);
    return NextResponse.json(
      { message: "Internal server error during avatar upload" },
      { status: 500 }
    );
  }
};
