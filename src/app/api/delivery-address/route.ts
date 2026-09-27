import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth, getValidAccessToken } from "@/lib/server-auth";

export const GET = async (req: NextRequest) => {
    const token = await getValidAccessToken();
    if (!token) {
        return NextResponse.json([]);
    }
    try {
        const res = await fetchWithAuth(`${process.env.API_ENDPOINT_DATA}/delivery-addresses`, {
            method: "GET",
            headers: {
                'content-type': 'application/json',
            }
        });
        if (!res.ok) {
            return NextResponse.json([]);
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.data || data?.deliveryAddresses || []);
        return NextResponse.json(list);
    } catch (error: any) {
        return NextResponse.json([]);
    }
};

export const POST = async (req: NextRequest) => {
    try {
        const payload = await req.json();
        const res = await fetchWithAuth(`${process.env.API_ENDPOINT_DATA}/delivery-addresses`, {
            method: "POST",
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Failed to create delivery address' }, { status: 500 });
    }
};