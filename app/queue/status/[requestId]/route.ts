
import { NextResponse } from 'next/server';
import { getRequest } from '@/lib/queueStore';

export async function GET(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
    try {
        const { requestId } = await params;
        const item = getRequest(requestId);

        if (!item) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        return NextResponse.json({
            status: item.status,
            queue_position: item.status === 'pending' ? item.queuePosition : 0,
            estimated_wait: 0,
            attempts: item.attempts,
            last_error: item.error
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
