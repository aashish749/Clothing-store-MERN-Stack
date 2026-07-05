# Admin Analytics APIs

Base URL: http://localhost:5050

Headers:

- Authorization: Bearer YOUR_TOKEN

All routes in this file are Private + Admin.

Allowed period values:

- today
- yesterday
- week
- month
- year
- lastmonth
- last30days
- last6months
- custom

Allowed groupBy values:

- day
- week
- month

## GET /api/admin/analytics/revenue

Query params:

- period
- startDate (required for custom)
- endDate (required for custom)
- groupBy (default day)
- top (default 10, max 50)

Example:

- /api/admin/analytics/revenue?period=month&groupBy=day&top=10
- /api/admin/analytics/revenue?period=custom&startDate=2026-04-01&endDate=2026-04-21&groupBy=day

## GET /api/admin/analytics/users

Query params:

- period
- startDate and endDate for custom
- groupBy

Example:

- /api/admin/analytics/users?period=last30days&groupBy=day

## GET /api/admin/analytics/inventory

Query params:

- threshold (default 5)
- top (default 10, max 50)

Example:

- /api/admin/analytics/inventory?threshold=5&top=20
