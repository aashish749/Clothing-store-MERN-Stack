# Users APIs

Base URL: http://localhost:5050

Private headers:

- Authorization: Bearer YOUR_TOKEN
- Content-Type: application/json

## GET /api/users/profile

Access: Private

## PUT /api/users/profile/update

Access: Private

Body JSON:

```json
{
  "name": "Aashish Updated",
  "email": "aashish.updated@example.com",
  "password": "newPassword123"
}
```

All fields are optional in update.

## GET /api/users/admin/users

Access: Private

Note:

- In current route code, this is protected but not admin guarded.

## GET /api/users/addresses

Access: Private

## POST /api/users/addresses

Access: Private

Body JSON:

```json
{
  "label": "Home",
  "fullName": "Aashish Chalise",
  "phone": "9800000000",
  "line1": "Koteshwor",
  "line2": "Near Temple",
  "city": "Kathmandu",
  "state": "Bagmati",
  "postalCode": "44600",
  "country": "Nepal",
  "isDefault": true
}
```

Required fields:

- fullName
- phone
- line1
- city
- state
- postalCode
- country

## PUT /api/users/addresses/:addressId

Access: Private

Body JSON example:

```json
{
  "label": "Office",
  "phone": "9811111111",
  "city": "Lalitpur",
  "isDefault": true
}
```

## DELETE /api/users/addresses/:addressId

Access: Private

Body JSON:

```json
{}
```

## PUT /api/users/addresses/:addressId/default

Access: Private

Body JSON:

```json
{}
```
