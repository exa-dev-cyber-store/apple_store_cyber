import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
    const token = cookies().get('jwt') || cookies().get('token');
    if (!token?.value) {
        return NextResponse.json({ data: [] });
    }
    const config = {
        headers: {
            Authorization: `Bearer ${token.value}`
        }
    };
    try {
        const res = await axios.get(`${process.env.API_ENDPOINT_DATA}/carts`, config);
        return NextResponse.json(res.data);
    } catch (e: any) {
        const status = e.response?.status || 500;
        return NextResponse.json({ message: e.response?.data?.message || e.message || 'Failed to fetch cart' }, { status });
    }
};