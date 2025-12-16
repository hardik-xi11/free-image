import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = "edge";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const format = formData.get('format') as string;

        if (!file || !format) {
            return NextResponse.json({ error: 'Missing file or format' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let outputBuffer: Buffer;

        // Sharp conversion logic
        // We can add more options (quality, lossless) based on format if needed
        switch (format.toLowerCase()) {
            case 'jpg':
            case 'jpeg':
                outputBuffer = await sharp(buffer).jpeg({ quality: 80 }).toBuffer();
                break;
            case 'png':
                outputBuffer = await sharp(buffer).png({ palette: true }).toBuffer();
                break;
            case 'webp':
                outputBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
                break;
            case 'avif':
                outputBuffer = await sharp(buffer).avif({ quality: 50 }).toBuffer();
                break;
            default:
                return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
        }

        return new NextResponse(new Blob([outputBuffer as any]), {
            headers: {
                'Content-Type': `image/${format === 'jpg' ? 'jpeg' : format}`,
                'Content-Disposition': `attachment; filename="converted.${format}"`,
            },
        });
    } catch (error) {
        console.error('Conversion error:', error);
        return NextResponse.json({ error: 'Conversion failed' }, { status: 500 });
    }
}
