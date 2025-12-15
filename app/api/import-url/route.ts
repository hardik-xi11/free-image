import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
        }

        const response = await fetch(url);
        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch image' }, { status: 400 });
        }

        const contentType = response.headers.get('content-type');
        const arrayBuffer = await response.arrayBuffer();
        return new NextResponse(new Blob([arrayBuffer]), {
            headers: {
                'Content-Type': contentType || 'application/octet-stream',
            }
        });

    } catch (error) {
        console.error('URL Import error:', error);
        return NextResponse.json({ error: 'Failed to import URL' }, { status: 500 });
    }
}
