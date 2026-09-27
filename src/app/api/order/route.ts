import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth, getValidAccessToken } from "@/lib/server-auth";

export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const res = await fetchWithAuth(`${process.env.API_ENDPOINT_DATA}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Failed to create order' }, { status: 500 });
    }
};

export const GET = async (req: NextRequest) => {
    const token = await getValidAccessToken();
    if (!token) {
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

        const res = await fetchWithAuth(`${process.env.API_ENDPOINT_DATA}/orders${qs}`, {
            method: "GET",
        });
        if (!res.ok) {
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
        const data = await res.json();
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
};