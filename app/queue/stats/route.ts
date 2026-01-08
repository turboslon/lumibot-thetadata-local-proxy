
import { NextResponse } from 'next/server';
import { getStats } from '@/lib/queueStore';

export async function GET() {
    return NextResponse.json(getStats());
}
