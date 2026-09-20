import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
    const data = await req.json();
    const token = data.token;
    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        },
    };
    try {
        const res = await axios.get(`${process.env.API_ENDPOINT_USER}/me`, config);
        return NextResponse.json(res.data);
    } catch (e) {
        const error = e as AxiosError;
        if (error.response?.status === 401) {
            cookies().delete('jwt');
            return NextResponse.json(error.response?.data, { status: 401 });
        }
        return NextResponse.json({ message: 'Token validation failed' }, { status: error.response?.status || 500 });
    }
};
