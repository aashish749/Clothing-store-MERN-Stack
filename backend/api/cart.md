# Cart APIs

Base URL: http://localhost:5050

Private headers:

- Authorization: Bearer YOUR_TOKEN
- Content-Type: application/json

## GET /api/cart

Access: Private

## POST /api/cart/add

Access: Private

Body JSON:

```json
{
  "productId": "PRODUCT_ID",
  "quantity": 2,
  "selectedOptions": {
    "option1Name": "Color",
    "option1Value": "Black",
    "option2Name": "Storage",
    "option2Value": "256GB"
  }
}
```

For non-variant products:

```json
{
  "productId": "PRODUCT_ID",
  "quantity": 1,
  "selectedOptions": {}
}
```

## PUT /api/cart/items/:itemId

Access: Private

Body JSON example:

```json
{
  "quantity": 3,
  "selectedOptions": {
    "option1Name": "Color",
    "option1Value": "Blue",
    "option2Name": "",
    "option2Value": ""
  }
}
```

## DELETE /api/cart/items/:itemId

Access: Private

Body JSON:

```json
{}
```

## POST /api/cart/clear

Access: Private

Body JSON:

```json
{}
```

## POST /api/cart/merge

Access: Private

Body JSON:

```json
{
  "items": [
    {
      "productId": "PRODUCT_ID_1",
      "quantity": 2,
      "selectedOptions": {
        "option1Name": "Color",
        "option1Value": "Black",
        "option2Name": "",
        "option2Value": ""
      }
    },
    {
      "productId": "PRODUCT_ID_2",
      "quantity": 1,
      "selectedOptions": {}
    }
  ]
}
```

Response includes:

- skipped array for invalid items
- clearGuestCart true
