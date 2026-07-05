# Products APIs

Base URL: http://localhost:5050

Private admin headers:

- Authorization: Bearer YOUR_TOKEN

## POST /api/products/create

Access: Private + Admin

You can use JSON or multipart/form-data.

JSON body format:

```json
{
  "name": "iPhone 16",
  "description": "New phone",
  "price": 999,
  "markedPrice": 1099,
  "categories": ["CATEGORY_ID"],
  "images": ["https://example.com/image1.jpg"],
  "variants": [
    {
      "name": "Color",
      "values": ["Black", "Blue"]
    }
  ],
  "variantStocks": [
    {
      "option1Name": "Color",
      "option1Value": "Black",
      "option2Name": "",
      "option2Value": "",
      "stock": 10
    }
  ]
}
```

Important:

- variantStocks is required.
- For non-variant product, still send one entry with empty option names and values.

## POST /api/products/upload-images

Access: Private + Admin

Content-Type:

- multipart/form-data

Form field:

- images (up to 6 files)

## PUT /api/products/update/:id

Access: Private + Admin

JSON body format (example):

```json
{
  "name": "iPhone 16 Pro",
  "price": 1199,
  "markedPrice": 1299,
  "categories": ["CATEGORY_ID"],
  "images": ["https://example.com/new-image.jpg"],
  "variants": [],
  "variantStocks": [
    {
      "option1Name": "",
      "option1Value": "",
      "option2Name": "",
      "option2Value": "",
      "stock": 25
    }
  ]
}
```

## DELETE /api/products/delete/:id

Access: Private + Admin

Body JSON:

```json
{}
```

## GET /api/products/list

Access: Public

Optional query params:

- pageNumber
- keyword
- category
- minPrice
- maxPrice
- minRating
- maxRating

Example:

- /api/products/list?pageNumber=1&keyword=iphone&minPrice=100&maxPrice=1500

## GET /api/products/detail/:id

Access: Public
