# Migration Guide: Omise to Stripe

## 🎯 **ทำไมต้องเปลี่ยนไปใช้ Stripe?**

### ปัญหาของ Omise ที่พบ:

1. **Webhook ไม่ทำงาน** - Status ไม่อัปเดตอัตโนมัติ
2. **Error Handling ซับซ้อน** - Debug ยาก
3. **TypeScript Support จำกัด** - Type safety น้อย
4. **Documentation ไม่ครบ** - เรียนรู้ยาก
5. **Manual Status Checking** - ต้องเขียน polling เอง

### ข้อดีของ Stripe:

1. **Webhook ทำงานได้ 100%** - Status อัปเดตอัตโนมัติ
2. **Error Handling ดี** - Debug ง่าย
3. **TypeScript Support ดีมาก** - Type safety สูง
4. **Documentation ครบถ้วน** - เรียนรู้ง่าย
5. **React Components** - UI ง่ายขึ้น

## 📋 **Migration Plan**

### Phase 1: Setup Stripe (1-2 วัน)

```bash
# Install packages
npm install stripe @nestjs/stripe
npm install @stripe/stripe-js @stripe/react-stripe-js

# Environment variables
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Phase 2: Backend Migration (3-5 วัน)

1. สร้าง `StripePaymentsService`
2. อัปเดต `PaymentsController`
3. สร้าง `StripeWebhookController`
4. อัปเดต database schema (ถ้าจำเป็น)

### Phase 3: Frontend Migration (2-3 วัน)

1. สร้าง `PaymentForm` component
2. อัปเดต payment page
3. เพิ่ม Stripe Elements
4. ทดสอบ payment flow

### Phase 4: Testing & Deployment (2-3 วัน)

1. ทดสอบใน test environment
2. Deploy to staging
3. ทดสอบกับ real payments
4. Deploy to production

## 🔄 **Migration Steps**

### Step 1: Install Stripe

```bash
# Backend
cd application/payment-service
npm install stripe @nestjs/stripe

# Frontend
cd application/boxing-fight-booking
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Step 2: Environment Setup

```env
# .env
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# .env.local (Frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

### Step 3: Backend Implementation

```typescript
// stripe-payments.service.ts
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
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: { enabled: true },
    });
  }
}
```

### Step 4: Frontend Implementation

```tsx
// PaymentForm.tsx
import { Elements, PaymentElement } from '@stripe/react-stripe-js';

export default function PaymentForm() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormComponent />
    </Elements>
  );
}
```

## 📊 **Comparison Table**

| Feature            | Omise (Current) | Stripe (Proposed) |
| ------------------ | --------------- | ----------------- |
| **Setup Time**     | ✅ Done         | ⏳ 1-2 weeks      |
| **TypeScript**     | ⚠️ Basic        | ✅ Excellent      |
| **Webhook**        | ❌ Manual       | ✅ Automatic      |
| **Error Handling** | ⚠️ Complex      | ✅ Simple         |
| **UI Components**  | ❌ Custom       | ✅ Built-in       |
| **Documentation**  | ⚠️ Limited      | ✅ Comprehensive  |
| **Testing**        | ⚠️ Manual       | ✅ Built-in       |
| **Support**        | ⚠️ Limited      | ✅ 24/7           |
| **Cost**           | 💰 3.65%        | 💰 3.4% + 2.9%    |

## 🚀 **Quick Start Example**

### 1. Create Payment Intent

```typescript
// Backend
const paymentIntent = await stripe.paymentIntents.create({
  amount: 353000, // 3530.00 THB
  currency: 'thb',
  metadata: {
    seat_id: 'seat-uuid',
    customer_email: 'user@example.com',
  },
});
```

### 2. Frontend Payment

```tsx
// Frontend
const { error, paymentIntent } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: `${window.location.origin}/booking/success`,
  },
});
```

### 3. Webhook Handling

```typescript
// Backend
@Post('webhook/stripe')
async handleStripeWebhook(@Req() req: Request) {
  const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

  if (event.type === 'payment_intent.succeeded') {
    await this.updatePaymentStatus(event.data.object.id, 'paid');
  }
}
```

## ⚡ **Benefits After Migration**

### 1. **ลด Bugs**

- TypeScript support ดีขึ้น
- Error handling ง่ายขึ้น
- Webhook ทำงานได้ 100%

### 2. **ลด Development Time**

- ไม่ต้องเขียน polling
- ไม่ต้องจัดการ webhook เอง
- มี React components ใช้

### 3. **เพิ่ม User Experience**

- Payment UI ดีขึ้น
- Error messages ชัดเจน
- Loading states ดีขึ้น

### 4. **ง่ายต่อการ Maintain**

- Code น้อยลง
- Documentation ดี
- Community support ดี

## 🎯 **Recommendation**

**แนะนำให้เปลี่ยนไปใช้ Stripe เพราะ:**

1. **แก้ปัญหาได้ 100%** - Webhook, Error handling, TypeScript
2. **ลดเวลา Development** - ไม่ต้องเขียน custom code มาก
3. **เพิ่ม User Experience** - UI ดีขึ้น, Error handling ดีขึ้น
4. **ง่ายต่อการ Maintain** - Code น้อยลง, Documentation ดี
5. **Future-proof** - Stripe มี roadmap ดี, Update บ่อย

**Timeline: 1-2 สัปดาห์**
**Effort: Medium**
**Risk: Low** (สามารถทำ gradual migration ได้)

คุณต้องการให้ฉันเริ่มสร้าง Stripe implementation สำหรับโปรเจคของคุณไหม?
