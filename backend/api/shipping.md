# Shipping APIs

Base URL: http://localhost:5050

## GET /api/shipping

Access: Public

No body required.

## PUT /api/shipping

Access: Private + Admin

Headers:

- Authorization: Bearer YOUR_TOKEN
- Content-Type: application/json

Body JSON:

```json
{
  "fee": 100,
  "freeShippingThreshold": 2000
}
```

Validation:

- fee must be number >= 0
- freeShippingThreshold must be number >= 0
