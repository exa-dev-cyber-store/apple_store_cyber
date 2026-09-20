import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
    const token = cookies().get('jwt') || cookies().get('token');
    if (!token?.value) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.value}`
        }
    };
    try {
        const res = await fetch(`${process.env.API_ENDPOINT_USER}/user`, config);
        const user = await res.json();
        return NextResponse.json(user, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Failed to fetch user' }, { status: 500 });
    }
};