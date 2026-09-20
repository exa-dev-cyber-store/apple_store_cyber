import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from "next/server";
import axios from 'axios';

export const GET = async (req: NextRequest, { params: { id } }: { params: { id: string } }) => {
    const token = cookies().get('jwt') || cookies().get('token');
    if (!token?.value) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const config = {
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${token.value}`
        }
    };
    try {
        const res = await fetch(`${process.env.API_ENDPOINT_DATA}/delivery-addresses/${id}`, config);
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Failed to fetch delivery address' }, { status: 500 });
    }
};

export const PUT = async (req: NextRequest, { params: { id } }: { params: { id: string } }) => {
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
        const { data } = await axios.put(`${process.env.API_ENDPOINT_DATA}/delivery-addresses/${id}`, payload, config);
        return NextResponse.json(data);
    } catch (error: any) {
        const status = error.response?.status || 500;
        return NextResponse.json({ message: error.response?.data?.message || error.message || 'Failed to update delivery address' }, { status });
    }
};

export const DELETE = async (req: NextRequest, { params: { id } }: { params: { id: string } }) => {
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
        const { data } = await axios.delete(`${process.env.API_ENDPOINT_DATA}/delivery-addresses/${id}`, config);
        return NextResponse.json(data);
    } catch (error: any) {
        const status = error.response?.status || 500;
        return NextResponse.json({ message: error.response?.data?.message || error.message || 'Failed to delete delivery address' }, { status });
    }
};