# Stripe Payment Implementation Guide

## ข้อดีของการใช้ Stripe

### 1. **TypeScript Support ดีมาก**

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Type-safe payment creation
const paymentIntent = await stripe.paymentIntents.create({
  amount: 353000, // 3530.00 THB
  currency: 'thb',
  metadata: {
    seat_id: 'seat-uuid',
    customer_email: 'user@example.com',
  },
});
```

### 2. **Webhook Handling อัตโนมัติ**

```typescript
// NestJS Webhook Controller
@Controller('webhook')
export class WebhookController {
  @Post('stripe')
  async handleStripeWebhook(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret,
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
      }

      res.json({ received: true });
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
}
```

### 3. **React Components สำหรับ UI**

```tsx
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/success`,
      },
    });

    if (error) {
      console.error('Payment failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button disabled={!stripe}>Pay Now</button>
    </form>
  );
}

// Usage
<Elements stripe={stripePromise}>
  <PaymentForm />
</Elements>;
```

## Migration Plan จาก Omise ไป Stripe

### Phase 1: Setup Stripe

```bash
# Install Stripe packages
npm install stripe @nestjs/stripe
npm install @stripe/stripe-js @stripe/react-stripe-js

# Environment variables
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Phase 2: Backend Migration

```typescript
// payments.service.ts
import Stripe from 'stripe';

@Injectable()
export class StripePaymentsService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-06-20',
    });
  }

  async createPaymentIntent(amount: number, currency: string, metadata: any) {
    return await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  async confirmPayment(paymentIntentId: string) {
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }
}
```

### Phase 3: Frontend Migration

```tsx
// PaymentPage.tsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export default function PaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
}
```

## เปรียบเทียบ Omise vs Stripe

| Feature            | Omise           | Stripe           |
| ------------------ | --------------- | ---------------- |
| TypeScript Support | ⚠️ Basic        | ✅ Excellent     |
| Webhook Handling   | ❌ Manual       | ✅ Automatic     |
| Error Handling     | ⚠️ Complex      | ✅ Simple        |
| Documentation      | ⚠️ Limited      | ✅ Comprehensive |
| React Components   | ❌ None         | ✅ Built-in      |
| Payment Methods    | ✅ Thai-focused | ✅ Global        |
| Testing            | ⚠️ Limited      | ✅ Excellent     |
| Support            | ⚠️ Limited      | ✅ 24/7          |

## ตัวอย่างการใช้งานจริง

### 1. **Payment Intent Creation**

```typescript
// Backend
const paymentIntent = await stripe.paymentIntents.create({
  amount: 353000, // 3530.00 THB
  currency: 'thb',
  metadata: {
    seat_id: 'seat-uuid',
    customer_email: 'user@example.com',
    event_id: 'event-uuid',
  },
  automatic_payment_methods: {
    enabled: true,
  },
});
```

### 2. **Payment Confirmation**

```typescript
// Frontend
const { error, paymentIntent } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: `${window.location.origin}/booking/success`,
  },
});

if (paymentIntent.status === 'succeeded') {
  // Payment successful
  router.push('/booking/success');
}
```

### 3. **Webhook Handling**

```typescript
// Backend
@Post('webhook/stripe')
async handleStripeWebhook(@Req() req: Request, @Res() res: Response) {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      await this.updatePaymentStatus(paymentIntent.id, 'paid');
    }

    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
```

## การตั้งค่า Environment

```env
# Stripe Keys
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

## สรุป

**แนะนำให้ใช้ Stripe เพราะ:**

1. **TypeScript Support ดีมาก** - ลด bugs
2. **Webhook Handling อัตโนมัติ** - ไม่ต้องเขียนเอง
3. **React Components** - UI ง่ายขึ้น
4. **Documentation ดี** - เรียนรู้ง่าย
5. **Error Handling ดี** - Debug ง่าย
6. **Testing Tools** - ทดสอบง่าย

**การ Migration:**

- ใช้เวลา 1-2 สัปดาห์
- สามารถทำแบบ gradual migration
- รองรับ payment methods ครบถ้วน
- มี community support ดี

คุณต้องการให้ฉันสร้างตัวอย่างการใช้งาน Stripe สำหรับโปรเจคของคุณไหม?
