import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { randomBytes } from 'crypto';

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
    throw new Error('Razorpay Key ID or Key Secret is not defined in environment variables.');
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export async function POST() {
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
