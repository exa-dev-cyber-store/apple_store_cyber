import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
    const data = await req.json();
    try {
        const res = await axios.post(`${process.env.API_ENDPOINT_USER}/resend-verification`, {
            email: data.email,
        });
        return NextResponse.json(res.data);
    } catch (e: any) {
        const status = e.response?.status || 500;
        return NextResponse.json(
            { message: e.response?.data?.message || e.message || 'Failed to resend verification code' },
            { status }
        );
    }
};
