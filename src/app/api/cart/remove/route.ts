import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface Data {
    productId: string;
}

export const POST = async (req: NextRequest) => {
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
        const res = await axios.post(`${process.env.API_ENDPOINT_DATA}/carts/remove`, {
            productId: data.productId
        }, config);
        return NextResponse.json({ message: 'Item removed from cart', data: res.data });
    } catch (e: any) {
        const status = e.response?.status || 500;
        return NextResponse.json({ message: e.response?.data?.message || e.message || 'Failed to remove item from cart' }, { status });
    }
};