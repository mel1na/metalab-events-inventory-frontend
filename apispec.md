# MetaRave Backend API Spec

## Items
### Create Item -> POST
Endpoint: `/api/items`

Required Request Header: `Authorization: Bearer <jwt>` with `"admin": "true"` grant
#### Request
`{"name":"Club Mate","price":300}`
#### Response
```
{
  "data": {
    "id": 1,
    "name": "Club Mate",
    "price": 300
  }
}
```

### List Items -> GET
Endpoint: `/api/items`
#### Request
no headers/body required
#### Response
```
{
  "data": [
    {
      "id": 1,
      "name": "Döner",
      "price": 500,
      "created_at": "2025-01-19T22:08:37.656728+01:00"
    },
    {
      "id": 2,
      "name": "Club Mate",
      "price": 300,
      "created_at": "2025-01-19T22:08:42.764738+01:00"
    }
  ]
}
```

### List Item -> GET
Endpoint: `/api/items/:id`
#### Request
no headers/body required
#### Response
```
{
  "data": {
    "id": 1,
    "name": "Döner",
    "price": 500,
    "created_at": "2025-01-19T22:08:37.656728+01:00"
  }
}
```

### Update Item -> PATCH
Endpoint: `/api/items`

Required Request Header: `Authorization: Bearer <jwt>` with `"admin": "true"` grant
#### Request
#### Response

### Delete Item -> DELETE
Endpoint: `/api/items`

Required Request Header: `Authorization: Bearer <jwt>` with `"admin": "true"` grant
#### Request
#### Response


## Purchases
### Create Purchase -> POST
Endpoint: `/api/purchases`

Required Request Header: `Authorization: Bearer <jwt>` with `"iss": "metalab-events-backend"` grant
#### Request
```
{
  "items": [
    {
      "id": 1,
      "quantity": 1
    },
    {
      "id": 2,
      "quantity": 2
    }
  ],
  "payment_type": "<cash OR card>",
  "tip": 300
}
```
#### Response
```
{
  "data": {
    "id": "54f1fd75-5879-4539-ae6d-066fd903ddb8",
    "items": [
      {
        "id": 1,
        "name": "Döner",
        "quantity": 1,
        "price": 500,
        "created_at": "0001-01-01T00:00:00Z"
      },
      {
        "id": 2,
        "name": "Club Mate",
        "quantity": 2,
        "price": 300,
        "created_at": "0001-01-01T00:00:00Z"
      }
    ],
    "payment_type": "card",
    "tip": 300,
    "final_cost": 1700,
    "created_at": "2025-01-19T22:44:40.356872+01:00"
  }
}
```
### List Purchases -> GET
Endpoint: `/api/purchases`
#### Request
no headers/body required
#### Response
```
{
  "data": [
    {
      "id": "54f1fd75-5879-4539-ae6d-066fd903ddb8",
      "items": [
        {
          "id": 1,
          "name": "Döner",
          "quantity": 1,
          "price": 500,
          "created_at": "0001-01-01T00:00:00Z"
        },
        {
          "id": 2,
          "name": "Club Mate",
          "quantity": 2,
          "price": 300,
          "created_at": "0001-01-01T00:00:00Z"
        }
      ],
      "payment_type": "card",
      "tip": 300,
      "final_cost": 1700,
      "created_at": "2025-01-19T22:44:40.356872+01:00"
    }
  ]
}
```

### List Purchase -> GET
Endpoint: `/api/purchases/:id`
#### Request
no headers/body required
#### Response
```
{
  "data": {
    "id": "54f1fd75-5879-4539-ae6d-066fd903ddb8",
    "items": [
      {
        "id": 1,
        "name": "Döner",
        "quantity": 1,
        "price": 500,
        "created_at": "0001-01-01T00:00:00Z"
      },
      {
        "id": 2,
        "name": "Club Mate",
        "quantity": 2,
        "price": 300,
        "created_at": "0001-01-01T00:00:00Z"
      }
    ],
    "payment_type": "card",
    "tip": 300,
    "final_cost": 1700,
    "created_at": "2025-01-19T22:44:40.356872+01:00"
  }
}
```

### Update Purchase -> PATCH
Endpoint: `/api/purchases`

Required Request Header: `Authorization: Bearer <jwt>` with `"admin": "true"` grant
#### Request
#### Response

### Delete Purchase -> DELETE
Endpoint: `/api/purchases`

Required Request Header: `Authorization: Bearer <jwt>` with `"admin": "true"` grant
#### Request
#### Response


## Groups
### Create Group -> POST
Endpoint: `/api/groups`

Required Request Header: `Authorization: Bearer <jwt>` with `"admin": "true"` grant
#### Request
`{"name":"Alkoholische Getränke","items":[{"id":3},{"id":6}]}`
#### Response
```
{
  "data": {
    "id": 1,
    "name": "Alkoholische Getränke",
    "items": [
      {
        "id": 3,
        "name": "Tschunk",
        "price": 500,
        "created_at": "0001-01-01T00:00:00Z"
      },
      {
        "id": 6,
        "name": "Shot 2cl",
        "price": 300,
        "created_at": "0001-01-01T00:00:00Z"
      }
    ],
    "created_at": "2025-01-19T22:18:27.97886+01:00"
  }
}
```

### List Groups -> GET
Endpoint: `/api/groups`
#### Request
no headers/body required
#### Response
```
{
  "data": [
    {
      "id": 1,
      "name": "Alkoholische Getränke",
      "items": [
        {
          "id": 3,
          "name": "Tschunk",
          "price": 500,
          "created_at": "0001-01-01T00:00:00Z"
        },
        {
          "id": 6,
          "name": "Shot 2cl",
          "price": 300,
          "created_at": "0001-01-01T00:00:00Z"
        }
      ],
      "created_at": "2025-01-19T22:18:27.97886+01:00"
    }
  ]
}
```

### List Group -> GET
Endpoint: `/api/groups/:id`
#### Request
no headers/body required
#### Response
```
{
  "data": {
    "id": 1,
    "name": "Alkoholische Getränke",
    "items": [
      {
        "id": 3,
        "name": "Tschunk",
        "price": 500,
        "created_at": "0001-01-01T00:00:00Z"
      },
      {
        "id": 6,
        "name": "Shot 2cl",
        "price": 300,
        "created_at": "0001-01-01T00:00:00Z"
      }
    ],
    "created_at": "2025-01-19T22:18:27.97886+01:00"
  }
}
```

### Update Group -> PATCH
Endpoint: `/api/groups`

Required Request Header: `Authorization: Bearer <jwt>` with `"admin": "true"` grant
#### Request
#### Response

### Delete Group -> DELETE
Endpoint: `/api/groups`

Required Request Header: `Authorization: Bearer <jwt>` with `"admin": "true"` grant
#### Request
#### Response