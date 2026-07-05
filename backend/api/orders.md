# Orders APIs

Base URL: http://localhost:5050

Private headers:

- Authorization: Bearer YOUR_TOKEN
- Content-Type: application/json

## POST /api/orders

Access: Private

Use either addressId or shippingAddress.

Body JSON with addressId:

```json
{
  "addressId": "ADDRESS_ID",
  "paymentMethod": "COD"
}
```

Body JSON with shippingAddress:

```json
{
  "paymentMethod": "STRIPE",
  "shippingAddress": {
    "fullName": "Aashish Chalise",
    "phone": "9800000000",
    "line1": "Koteshwor",
    "line2": "Near Temple",
    "city": "Kathmandu",
    "state": "Bagmati",
    "postalCode": "44600",
    "country": "Nepal"
  }
}
```

Valid paymentMethod values:

- COD
- STRIPE

## GET /api/orders

Access: Private

Returns logged-in user orders.

## GET /api/orders/:id

Access: Private

Allowed:

- order owner
- admin

## GET /api/orders/admin/all

Access: Private + Admin

## PUT /api/orders/admin/:id/status

Access: Private + Admin

Body JSON example:

```json
{
  "orderStatus": "Shipped",
  "isPaid": true
}
```
