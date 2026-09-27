import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const avatarFile = formData.get("avatar");
    if (!avatarFile) {
      return NextResponse.json({ message: "Avatar file is required" }, { status: 400 });
    }

    const backendUrl = process.env.API_ENDPOINT_USER || "http://localhost:5000/auth";

    // Reconstruct FormData to send to backend
    const backendFormData = new FormData();
    backendFormData.append("avatar", avatarFile);

    const res = await fetchWithAuth(`${backendUrl}/avatar`, {
      method: "POST",
      body: backendFormData,
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("Avatar upload proxy error:", error);
    return NextResponse.json(
      { message: "Internal server error during avatar upload" },
      { status: 500 }
    );
  }
};
