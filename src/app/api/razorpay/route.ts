
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error('Razorpay environment variables are not set.');
    return NextResponse.json({ error: 'Server configuration error. Payment keys are missing.' }, { status: 500 });
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
  
  let amount = 149; // Default for Valuation
  let currency = 'INR';
  let receiptId = `receipt_order_${randomBytes(8).toString('hex')}`;

  try {
    const body = await request.json();
    if (body.amount) {
      amount = body.amount; // Use the amount passed from the client
    }
  } catch (e) {
    // No body or invalid JSON, fallback to default valuation price
  }

  const options = {
    amount: amount * 100, // Amount in paise
    currency,
    receipt: receiptId,
  };

  try {
    const order = await razorpay.orders.create(options);
    if (!order) {
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
    return NextResponse.json({ ...order, key: keyId });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
