import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
    try {
        const category = req.nextUrl.searchParams.get('category');
        const skip = req.nextUrl.searchParams.get('skip');
        const q = req.nextUrl.searchParams.get('q');
        const id = req.nextUrl.searchParams.get('id');
        const limit = req.nextUrl.searchParams.get('limit');
        const sort = req.nextUrl.searchParams.get('sort') || req.nextUrl.searchParams.get('sortBy') || '';

        const params = new URLSearchParams();
        if (limit && limit !== 'null' && limit !== 'undefined') params.set('limit', limit);
        if (skip && skip !== 'null' && skip !== 'undefined') params.set('skip', skip);
        if (category && category !== 'null' && category !== 'undefined') params.set('category', category);
        if (q && q !== 'null' && q !== 'undefined') params.set('q', q);
        if (id && id !== 'null' && id !== 'undefined') params.set('id', id);
        if (sort && sort !== 'null' && sort !== 'undefined') params.set('sort', sort);

        const queryString = params.toString();
        const targetUrl = queryString 
            ? `${process.env.API_ENDPOINT_DATA}/products?${queryString}`
            : `${process.env.API_ENDPOINT_DATA}/products`;

        const response = await fetch(targetUrl, { cache: 'no-store' });
        const data = await response.json();
        return NextResponse.json(data || { data: [] }, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Failed to fetch products', data: [] }, { status: 500 });
    }
};
