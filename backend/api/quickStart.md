# Quick Start For Testing

Base URL:

- http://localhost:5050

## Header templates

Public JSON routes:

```http
Content-Type: application/json
```

Private JSON routes:

```http
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN
```

Private multipart routes:

```http
Authorization: Bearer YOUR_TOKEN
```

## JSON body format tips

1. Always use double quotes in JSON keys and string values.
2. Do not leave trailing commas.
3. IDs are strings:

```json
{
  "productId": "67f123abc..."
}
```

4. Empty body should be:

```json
{}
```

5. Array body format:

```json
{
  "items": [
    {
      "productId": "PRODUCT_ID",
      "quantity": 1,
      "selectedOptions": {}
    }
  ]
}
```

## Suggested testing order

1. auth register
2. auth login
3. categories create
4. products create
5. cart add
6. cart get
7. orders create
8. payments create-intent and confirm (if STRIPE)
9. reviews add
