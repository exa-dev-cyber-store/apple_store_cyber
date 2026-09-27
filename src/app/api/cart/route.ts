import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth, getValidAccessToken } from "@/lib/server-auth";

export const GET = async (req: NextRequest) => {
    const token = await getValidAccessToken();
    if (!token) {
        return NextResponse.json({ data: [] });
    }
    try {
        const res = await fetchWithAuth(`${process.env.API_ENDPOINT_DATA}/carts`, {
            method: "GET",
        });
        const data = await res.json().catch(() => ({ data: [] }));
        return NextResponse.json(data, { status: res.status });
    } catch (e: any) {
        return NextResponse.json({ data: [] });
    }
};