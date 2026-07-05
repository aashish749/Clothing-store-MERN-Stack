# Payments APIs

Base URL: http://localhost:5050

Private headers:

- Authorization: Bearer YOUR_TOKEN
- Content-Type: application/json

## POST /api/payments/create-intent

Access: Private

Body JSON:

```json
{
  "orderId": "ORDER_ID"
}
```

Important checks in backend:

- Order must exist
- User must own order or be admin
- Order paymentMethod must be STRIPE
- Order must not be paid already

## POST /api/payments/confirm

Access: Private

Body JSON minimum:

```json
{
  "paymentIntentId": "pi_123456789"
}
```

Body JSON with paymentMethodId:

```json
{
  "paymentIntentId": "pi_123456789",
  "paymentMethodId": "pm_123456789"
}
```

## POST /api/payments/webhook

Access: Public (called by Stripe)

Important:

- This route uses raw body for signature verification.
- Do not call this like normal app JSON route unless intentionally testing webhook behavior.
