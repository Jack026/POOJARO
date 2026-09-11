import { NextRequest, NextResponse } from 'next/server';
import { resolvePincode } from '@/lib/domain/pincodes';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pincode: string }> }
) {
  try {
    const { pincode } = await params;
    const location = resolvePincode(pincode);

    if (!location) {
      return NextResponse.json(
        { error: 'Invalid or unsupported 6-digit Indian PIN code' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ...location,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
