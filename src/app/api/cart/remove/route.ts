import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/server-auth";

interface Data {
    productId: string;
}

export const POST = async (req: NextRequest) => {
    try {
        const data: Data = await req.json();
        const res = await fetchWithAuth(`${process.env.API_ENDPOINT_DATA}/carts/remove`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                productId: data.productId
            }),
        });
        const resData = await res.json().catch(() => ({}));
        if (!res.ok) {
            return NextResponse.json(resData, { status: res.status });
        }
        return NextResponse.json({ message: 'Item removed from cart', data: resData });
    } catch (e: any) {
        return NextResponse.json({ message: e.message || 'Failed to remove item from cart' }, { status: 500 });
    }
};