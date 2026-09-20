import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params: { id } }: { params: { id: string } }) {
    const token = cookies().get('jwt') || cookies().get('token');
    try {
        const res = await fetch(`${process.env.API_ENDPOINT_DATA}/invoices/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token?.value}`
            },
            cache: 'no-store'
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Failed to fetch invoice' }, { status: 500 });
    }
};