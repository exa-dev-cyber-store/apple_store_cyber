import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth-cookies";

const handleLogout = async (req: NextRequest) => {
  const cookieStore = cookies();
  const token = cookieStore.get("jwt")?.value || cookieStore.get("token")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (token || refreshToken) {
    try {
      await fetch(`${process.env.API_ENDPOINT_USER}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error: any) {
      console.warn("Backend logout note:", error?.message);
    }
  }

  clearAuthCookies();
  return NextResponse.json({ success: true, message: "Logged out successfully" });
};

export const GET = handleLogout;
export const POST = handleLogout;