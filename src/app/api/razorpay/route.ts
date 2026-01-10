import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { randomBytes } from 'crypto';

export async function POST() {
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
  
  const amount = 149; // Amount in INR
  const currency = 'INR';

  const options = {
    amount: amount * 100, // Amount in the smallest currency unit (paise)
    currency,
    receipt: `receipt_order_${randomBytes(8).toString('hex')}`, // Unique receipt ID
  };

  try {
    const order = await razorpay.orders.create(options);
    if (!order) {
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
