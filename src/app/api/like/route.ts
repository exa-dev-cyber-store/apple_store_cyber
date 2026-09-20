import axios from "axios";
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
    const cookie = cookies().get('jwt') || cookies().get('token');
    if (!cookie?.value) {
        return NextResponse.json([]);
    }
    const config = {
        headers: {
            Authorization: `Bearer ${cookie.value}`
        }
    };
    try {
        const { data } = await axios.get(`${process.env.API_ENDPOINT_DATA}/likes`, config);
        const list = Array.isArray(data) ? data : (data?.data || data?.likes || []);
        return NextResponse.json(list);
    } catch (error: any) {
        return NextResponse.json([]);
    }
};

export const POST = async (req: NextRequest) => {
    const cookie = cookies().get('jwt') || cookies().get('token');
    if (!cookie?.value) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const request: { productId: string } = await req.json();
    const config = {
        headers: {
            Authorization: `Bearer ${cookie.value}`
        }
    };
    try {
        const res = await axios.post(`${process.env.API_ENDPOINT_DATA}/likes`, request, config);
        return NextResponse.json(res.data);
    } catch (error: any) {
        const status = error.response?.status || 500;
        return NextResponse.json({ message: error.response?.data?.message || error.message || 'Failed to update like' }, { status });
    }
};