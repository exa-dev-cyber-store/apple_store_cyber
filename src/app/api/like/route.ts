import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth, getValidAccessToken } from "@/lib/server-auth";

export const GET = async (req: NextRequest) => {
    const token = await getValidAccessToken();
    if (!token) {
        return NextResponse.json([]);
    }
    try {
        const res = await fetchWithAuth(`${process.env.API_ENDPOINT_DATA}/likes`, {
            method: "GET",
        });
        if (!res.ok) {
            return NextResponse.json([]);
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.data || data?.likes || []);
        return NextResponse.json(list);
    } catch (error: any) {
        return NextResponse.json([]);
    }
};

export const POST = async (req: NextRequest) => {
    try {
        const request: { productId: string } = await req.json();
        const res = await fetchWithAuth(`${process.env.API_ENDPOINT_DATA}/likes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
        });
        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Failed to update like' }, { status: 500 });
    }
};