import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface Data {
    productId: string;
    quantity: number;
}

export async function POST(req: NextRequest) {
    const token = cookies().get('jwt') || cookies().get('token');
    if (!token?.value) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const data: Data = await req.json();
    const config = {
        headers: {
            Authorization: `Bearer ${token.value}`
        }
    };
    try {
        const res = await axios.post(`${process.env.API_ENDPOINT_DATA}/carts`, {
            productId: data.productId,
            quantity: data.quantity
        }, config);
        return NextResponse.json({ message: 'Item added to cart', data: res.data });
    } catch (e: any) {
        const status = e.response?.status || 500;
        return NextResponse.json({ message: e.response?.data?.message || e.message || 'Failed to add item to cart' }, { status });
    }
}