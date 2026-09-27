import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/server-auth";

export const GET = async (req: NextRequest, { params: { id } }: { params: { id: string } }) => {
    try {
        const res = await fetchWithAuth(`${process.env.API_ENDPOINT_DATA}/delivery-addresses/${id}`, {
            method: "GET",
            headers: {
                'content-type': 'application/json',
            }
        });
        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Failed to fetch delivery address' }, { status: 500 });
    }
};

export const PUT = async (req: NextRequest, { params: { id } }: { params: { id: string } }) => {
    try {
        const payload = await req.json();
        const res = await fetchWithAuth(`${process.env.API_ENDPOINT_DATA}/delivery-addresses/${id}`, {
            method: "PUT",
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Failed to update delivery address' }, { status: 500 });
    }
};

export const DELETE = async (req: NextRequest, { params: { id } }: { params: { id: string } }) => {
    try {
        const res = await fetchWithAuth(`${process.env.API_ENDPOINT_DATA}/delivery-addresses/${id}`, {
            method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Failed to delete delivery address' }, { status: 500 });
    }
};