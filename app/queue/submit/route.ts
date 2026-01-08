
import { NextResponse } from 'next/server';
import { submitRequest } from '@/lib/queueStore';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const item = submitRequest(payload);

        return NextResponse.json({
            request_id: item.requestId,
            status: item.status,
            queue_position: item.queuePosition
        });
    } catch (e: any) {
        console.error('Submit failed', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
