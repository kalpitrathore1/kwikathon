# Wishlist App Backend

A Node.js backend server for a wishlist app for Shopify store merchants.

## Features

- User authentication with phone number and OTP
- JWT token-based authentication
- Add products to wishlist
- Get wishlist items
- Remove items from wishlist
- Get number of people interested in a product
- Shopify product update webhook
- Product price history tracking
- Price comparison to determine if current price is all-time low
- MongoDB database for data storage with in-memory fallback

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/wishlist-app
   JWT_SECRET=your_jwt_secret_key
   ```

## Running the Server

### Development mode
```
npm run dev
```

### Production mode
```
npm start
```

## API Endpoints

### Authentication

- **POST /api/auth/send-otp**
  - Request body: `{ "phone": "1234567890" }`
  - Response: `{ "msg": "OTP sent successfully", "phone": "1234567890" }`

- **POST /api/auth/verify-otp**
  - Request body: `{ "phone": "1234567890", "otp": "1212" }`
  - Response: `{ "token": "jwt_token_here" }`

### Wishlist

- **POST /api/wishlist**
  - Headers: `{ "x-auth-token": "jwt_token_here" }`
  - Request body:
    ```
    {
      "merchantId": "merchant123",
      "productId": "product123"
    }
    ```
  - Response: Wishlist item object

- **GET /api/wishlist**
  - Headers: `{ "x-auth-token": "jwt_token_here" }`
  - Response: Array of wishlist items

- **GET /api/wishlist/merchant/:merchantId**
  - Headers: `{ "x-auth-token": "jwt_token_here" }`
  - Response: Array of wishlist items for the specified merchant

- **DELETE /api/wishlist/:id**
  - Headers: `{ "x-auth-token": "jwt_token_here" }`
  - Response: `{ "msg": "Wishlist item removed" }`

- **POST /api/wishlist/interested**
  - Request body: `{ "productId": "product123" }`
  - Response: `{ "count": 5 }` (Number of users interested in the product)

### Products

- **POST /api/products/webhook**
  - Request body:
    ```
    {
      "id": "product123",
      "price": 99.99,
      "title": "Product Name"
    }
    ```
  - Response: `{ "success": true }`

- **GET /api/products/:productId/price-comparison**
  - Response:
    ```
    {
      "productId": "product123",
      "currentPrice": 99.99,
      "lowestPrice": 89.99,
      "isAllTimeLow": false,
      "priceHistory": [
        {
          "price": 99.99,
          "timestamp": "2023-04-25T10:30:00.000Z"
        },
        {
          "price": 109.99,
          "timestamp": "2023-04-20T08:15:00.000Z"
        },
        {
          "price": 89.99,
          "timestamp": "2023-04-15T14:45:00.000Z"
        }
      ]
    }
    ```

## Notes

- For demonstration purposes, the OTP is hardcoded as "1212"
- In a production environment, you would implement a proper OTP generation and delivery system# kwikathon
