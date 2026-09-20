import axios from 'axios';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
    const token = cookies().get('jwt') || cookies().get('token');
    if (!token?.value) {
        return NextResponse.json([]);
    }
    const config = {
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${token.value}`
        }
    };
    try {
        const res = await fetch(`${process.env.API_ENDPOINT_DATA}/delivery-addresses`, config);
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
    const token = cookies().get('jwt') || cookies().get('token');
    if (!token?.value) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const config = {
        headers: {
            Authorization: `Bearer ${token.value}`
        }
    };
    try {
        const payload = await req.json();
        const { data } = await axios.post(`${process.env.API_ENDPOINT_DATA}/delivery-addresses`, payload, config);
        return NextResponse.json(data);
    } catch (error: any) {
        const status = error.response?.status || 500;
        return NextResponse.json({ message: error.response?.data?.message || error.message || 'Failed to create delivery address' }, { status });
    }
};