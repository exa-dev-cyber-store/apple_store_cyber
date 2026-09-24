import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
    const data = await req.json();
    const token = req.cookies.get("token")?.value || req.headers.get("authorization")?.replace("Bearer ", "");

    try {
        const res = await axios.post(
            `${process.env.API_ENDPOINT_USER}/set-password`,
            {
                password: data.password,
                confirmPassword: data.confirmPassword,
            },
            {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
        );
        return NextResponse.json(res.data);
    } catch (e: any) {
        const status = e.response?.status || 500;
        return NextResponse.json(
            { message: e.response?.data?.message || e.message || 'Failed to set password' },
            { status }
        );
    }
};
