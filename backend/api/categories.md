# Categories APIs

Base URL: http://localhost:5050

Private admin headers:

- Authorization: Bearer YOUR_TOKEN

## POST /api/categories/create

Access: Private + Admin

Body JSON:

```json
{
  "name": "Mobiles"
}
```

## PUT /api/categories/update/:id

Access: Private + Admin

Body JSON:

```json
{
  "name": "Smartphones"
}
```

## DELETE /api/categories/delete/:id

Access: Private + Admin

Body JSON:

```json
{}
```

## GET /api/categories/list

Access: Public

## GET /api/categories/detail/:id

Access: Public
