# Payment & Credit Management API Documentation

This document provides comprehensive documentation for the payment and credit management endpoints in the SEO PR system.

## Base URL
```
API Base URL: /api/users
Authentication: Bearer Token required for all endpoints
```

## Table of Contents
1. [Credit Management](#credit-management)
2. [Plan Information](#plan-information)
3. [Payment Processing](#payment-processing)
4. [Error Responses](#error-responses)
5. [Data Models](#data-models)

## Credit Management

### 1. Get User Credits & Plan Information

**Endpoint:** `GET /api/users/credits`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response:**
```json
{
  "credits": 50,
  "totalCreditsUsed": 0,
  "planType": "free",
  "dailyRequestLimit": 5,
  "dailyRequestsUsed": 0,
  "dailyRequestsRemaining": 5,
  "isPaymentActive": false,
  "paymentExpiryDate": null,
  "planDetails": {
    "credits": 50,
    "price": 0,
    "dailyLimit": 5
  },
  "creditsPerRequest": 10
}
```

**Description:** Returns comprehensive information about user's current credit balance, plan details, and daily usage limits.

---

### 2. Check Campaign Creation Eligibility

**Endpoint:** `GET /api/users/can-create-campaign`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response:**
```json
{
  "canCreate": true,
  "reason": null,
  "creditsInfo": {
    "credits": 50,
    "totalCreditsUsed": 0,
    "planType": "free",
    "dailyRequestLimit": 5,
    "dailyRequestsUsed": 0,
    "dailyRequestsRemaining": 5,
    "isPaymentActive": false,
    "paymentExpiryDate": null
  },
  "creditsRequired": 10
}
```

**Possible Responses:**
- `canCreate: false` with `reason: "Insufficient credits"` - User needs to purchase credits
- `canCreate: false` with `reason: "Daily limit reached"` - User has exceeded daily request limit

**Description:** Checks if user can create a new campaign based on available credits and daily limits.

---

## Plan Information

### 3. Get Available Plans

**Endpoint:** `GET /api/users/plans`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response:**
```json
{
  "free": {
    "name": "Free",
    "price": 0,
    "credits": 50,
    "dailyLimit": 5,
    "description": "Perfect for testing"
  },
  "basic": {
    "name": "Basic",
    "price": 2000,
    "credits": 4000,
    "dailyLimit": 50,
    "description": "Great for small businesses"
  },
  "premium": {
    "name": "Premium",
    "price": 4000,
    "credits": 10000,
    "dailyLimit": 100,
    "description": "Perfect for growing businesses"
  },
  "unlimited": {
    "name": "Unlimited",
    "price": 7500,
    "credits": -1,
    "dailyLimit": 999999,
    "description": "For serious marketers"
  }
}
```

**Description:** Returns all available subscription plans with their pricing, credit allocation, and features.

---

## Payment Processing

### 4. Create Payment

**Endpoint:** `POST /api/users/create-payment`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "planType": "basic"
}
```

**Valid planType values:**
- `"basic"` (₹2000 - 4000 credits)
- `"premium"` (₹4000 - 10000 credits)  
- `"unlimited"` (₹7500 - unlimited credits)

**Response:**
```json
{
  "paymentId": "pay_1703123456789_507f1f77bcf86cd799439011",
  "amount": 2000,
  "credits": 4000,
  "planType": "basic",
  "message": "Payment created successfully"
}
```

**Description:** Initiates a payment process for the selected plan. Returns a payment ID that can be used to confirm the payment later.

---

### 5. Confirm Payment

**Endpoint:** `POST /api/users/confirm-payment`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "paymentId": "pay_1703123456789_507f1f77bcf86cd799439011",
  "transactionId": "txn_1234567890abcdef"
}
```

**Response:**
```json
{
  "message": "Payment confirmed successfully",
  "creditsAdded": 4000,
  "planType": "basic"
}
```

**Error Responses:**
- `404` - Payment not found
- `400` - Payment already completed or invalid paymentId

**Description:** Confirms a payment and adds credits to the user's account. This should be called after successful payment processing.

---

### 6. Get Payment History

**Endpoint:** `GET /api/users/payment-history`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "planType": "basic",
    "creditsPurchased": 4000,
    "pricePaid": 2000,
    "paymentStatus": "completed",
    "paymentDate": "2023-12-21T10:30:00.000Z",
    "expiryDate": "2024-01-20T10:30:00.000Z",
    "createdAt": "2023-12-21T10:30:00.000Z",
    "updatedAt": "2023-12-21T10:35:00.000Z"
  }
]
```

**Description:** Returns the user's complete payment history with transaction details.

---

## Updated Campaign Creation

### 7. Create Campaign (Updated with Credit Check)

**Endpoint:** `POST /api/users/generate-traffic-by-subscription`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "keyword": "best seo tools",
  "url": "https://example.com",
  "country": "US"
}
```

**Success Response:**
```json
{
  "message": "Traffic generation tasks are being added to the queue",
  "creditsUsed": 10,
  "remainingCredits": 40,
  "dailyRequestsRemaining": 4
}
```

**Error Responses:**
- `403` - "Insufficient credits. Please purchase more credits or upgrade your plan."
- `403` - "Daily request limit reached. Please upgrade your plan or try again tomorrow."

**Description:** Creates a new traffic generation campaign. Automatically deducts 10 credits and checks daily limits before processing.

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid plan type"
}
```

### 401 Unauthorized
```json
{
  "error": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient credits. Please purchase more credits or upgrade your plan."
}
```

### 404 Not Found
```json
{
  "error": "Payment not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## Data Models

### User Credits Schema
```typescript
interface UserCredits {
  credits: number;                    // Available credits
  totalCreditsUsed: number;          // Total credits used by user
  planType: 'free' | 'basic' | 'premium' | 'unlimited';
  dailyRequestLimit: number;         // Daily request limit for user's plan
  dailyRequestsUsed: number;         // Requests used today
  dailyRequestsRemaining: number;    // Remaining daily requests
  isPaymentActive: boolean;          // Whether user has active paid plan
  paymentExpiryDate: Date | null;    // When paid plan expires
  planDetails: PlanDetails;
  creditsPerRequest: number;         // Always 10
}

interface PlanDetails {
  credits: number;      // Credits included in plan
  price: number;        // Plan price in rupees
  dailyLimit: number;   // Daily request limit
}
```

### Payment Schema
```typescript
interface Payment {
  _id: string;
  userId: string;
  planType: 'basic' | 'premium' | 'unlimited';
  creditsPurchased: number;
  pricePaid: number;
  paymentId: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId?: string;
  gatewayResponse?: object;
  paymentDate: Date;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Credit System Rules

### Credit Usage
- **10 credits per campaign request**
- Credits are deducted immediately when campaign creation is initiated
- Credits cannot be refunded once a campaign starts

### Daily Limits
- **Free Plan**: 5 requests per day
- **Basic Plan**: 50 requests per day  
- **Premium Plan**: 100 requests per day
- **Unlimited Plan**: Effectively unlimited (999,999 requests/day)
- Daily limits reset every 24 hours based on `lastResetDate`

### Plan Benefits
- **Free Plan**: 50 credits included, 5 daily requests
- **Basic Plan**: 4,000 credits for ₹2,000, 30-day validity
- **Premium Plan**: 10,000 credits for ₹4,000, 30-day validity  
- **Unlimited Plan**: Unlimited requests for ₹7,500, 30-day validity

---

## Frontend Integration Notes

### Recommended Frontend Flow
1. **Display Credits**: Call `/credits` endpoint to show user's current status
2. **Check Eligibility**: Call `/can-create-campaign` before allowing campaign creation
3. **Show Plans**: Call `/plans` to display available subscription options
4. **Payment Flow**: 
   - Call `/create-payment` to initiate payment
   - Process payment with your payment gateway
   - Call `/confirm-payment` to complete the transaction
5. **Update UI**: Refresh credits after successful payment

### Error Handling
Always check the response status and handle credit-related errors gracefully:
- Show purchase options when credits are insufficient
- Display daily limit warnings appropriately
- Handle network errors and retry mechanisms

This documentation should provide everything needed for frontend integration with the payment and credit management system.
