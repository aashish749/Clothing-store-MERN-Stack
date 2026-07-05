# Reviews APIs

Base URL: http://localhost:5050

Private headers:

- Authorization: Bearer YOUR_TOKEN
- Content-Type: application/json

## POST /api/reviews/products/:id/reviews

Access: Private

Body JSON:

```json
{
  "rating": 5,
  "comment": "Amazing product"
}
```

Rules:

- rating must be between 1 and 5
- user must have purchased this product in paid order
- one review per user per product

## GET /api/reviews/products/:id/reviews

Access: Public

## DELETE /api/reviews/:id

Access: Private

Body JSON:

```json
{}
```

Allowed:

- review owner
- admin

## POST /api/reviews/admin

Access: Private + Admin

Body JSON:

```json
{
  "productId": "PRODUCT_ID",
  "reviewerName": "John Doe",
  "rating": 4,
  "comment": "Good quality",
  "sourcePlatform": "Daraz"
}
```

## POST /api/reviews/admin/bulk

Access: Private + Admin

Body JSON:

```json
{
  "reviews": [
    {
      "productId": "PRODUCT_ID_1",
      "reviewerName": "Alice",
      "rating": 5,
      "comment": "Perfect",
      "sourcePlatform": "Amazon"
    },
    {
      "productId": "PRODUCT_ID_2",
      "reviewerName": "Bob",
      "rating": 4,
      "comment": "Nice",
      "sourcePlatform": "Flipkart"
    }
  ]
}
```
