
import { NextResponse } from 'next/server';
import { getRequest } from '@/lib/queueStore';

export async function GET(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
    try {
        const { requestId } = await params;
        const item = getRequest(requestId);

        if (!item) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (item.status === 'completed') {
            return NextResponse.json({
                result: item.result,
                status: 'completed'
            }, { status: 200 });
        } else if (item.status === 'failed' || item.status === 'dead') {
            return NextResponse.json({
                status: item.status,
                error: item.error
            }, { status: 500 });
        } else {
            return NextResponse.json({
                status: item.status
            }, { status: 202 });
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
