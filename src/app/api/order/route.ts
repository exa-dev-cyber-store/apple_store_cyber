import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest, res: NextResponse) => {
    const body = await req.json()
    const token = cookies().get('jwt')
    const config = {
        headers: {
            Authorization: `Bearer ${token?.value}`
        }
    }
    try {
        const { data } = await axios.post(`${process.env.API_ENDPOINT_DATA}/orders`, body, config)
        return NextResponse.json(data)
    } catch (error: any) {
        console.error(error);
        const status = error.response?.status || 500;
        return NextResponse.json({ message: error.response?.data?.message || error.message || 'Failed to create order' }, { status });
    }
};

export const GET = async (req: NextRequest, res: NextResponse) => {
    const token = cookies().get('jwt');
    if (!token?.value) {
        return NextResponse.json({
            data: [],
            orders: [],
            count: 0,
            total: 0,
            totalPages: 1,
            currentPage: 1,
            limit: 5,
        });
    }
    const config = {
        headers: {
            Authorization: `Bearer ${token?.value}`
        }
    };
    try {
        const { searchParams } = new URL(req.url);
        const page = searchParams.get("page");
        const limit = searchParams.get("limit");
        const status = searchParams.get("status");

        const queryParams = new URLSearchParams();
        if (page) queryParams.set("page", page);
        if (limit) queryParams.set("limit", limit);
        if (status) queryParams.set("status", status);
        const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";

        const { data } = await axios.get(`${process.env.API_ENDPOINT_DATA}/orders${qs}`, config);
        const list = Array.isArray(data) ? data : (data?.data || data?.orders || []);

        return NextResponse.json({
            data: list,
            orders: list,
            count: data?.count ?? list.length,
            total: data?.total ?? list.length,
            totalPages: data?.totalPages ?? 1,
            currentPage: data?.currentPage ?? (page ? parseInt(page) : 1),
            limit: data?.limit ?? (limit ? parseInt(limit) : list.length),
        });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({
            data: [],
            orders: [],
            count: 0,
            total: 0,
            totalPages: 1,
            currentPage: 1,
            limit: 5,
        });
    }
}