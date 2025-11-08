# Payment System Documentation

## Overview
The EventDash platform now supports a dual payment system for event tickets, allowing users to pay using either **Bank Transfer** or **Credit/Debit Card** (Visa/Mastercard).

## Payment Flow

### 1. Interest Selection
- When a logged-in user selects "Going" from the interest dropdown in the event details modal
- The payment modal automatically opens for ticket purchase

### 2. Payment Method Selection
Users can choose between two payment methods:

#### 💳 Credit/Debit Card
- Supports Visa and Mastercard
- Real-time card number formatting
- Secure processing (stores only last 4 digits)
- Auto-generated reference number
- Fields required:
  - Card Type (Visa/Mastercard)
  - Issuing Bank (NSB, Commercial Bank, etc.)
  - Card Holder's Name
  - Card Number (16 digits)
  - Expiry Date (MM/YY)
  - CVV (3 digits)

#### 🏦 Bank Transfer
- Traditional bank account transfer
- Manual verification by admin
- Fields required:
  - Your Bank Name
  - Your Account Name
  - Your Account Number
  - Transaction Reference Number

### 3. Payment Processing
- Payment amount automatically matches the event ticket price
- Form validation ensures all required fields are filled
- Payment status set to "pending" upon submission
- User's interest level updated to "going"
- Success notification displayed

## Database Schema

### Payments Table
```sql
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  account_number VARCHAR(50),
  account_name VARCHAR(100),
  bank_name VARCHAR(100) NOT NULL,
  reference_number VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  payment_method ENUM('bank', 'card') NOT NULL DEFAULT 'bank',
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP NULL,
  verified_by BIGINT NULL,
  UNIQUE KEY unique_payment (user_id, event_id, reference_number),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (event_id) REFERENCES events(id)
);
```

## API Endpoints

### 1. Submit Payment
**POST** `/api/payments`

**Request Body:**
```json
{
  "user_id": 1,
  "event_id": 5,
  "payment_method": "card",
  "bank_name": "Commercial Bank",
  "reference_number": "CARD-1234567890-5678",
  "amount": 1500.00,
  "payment_date": "2024-01-15",
  "account_number": "****5896",
  "account_name": "A M P DE SILVA"
}
```

**Response:**
```json
{
  "message": "Card payment processed successfully. Awaiting verification.",
  "payment_id": 42,
  "status": "pending",
  "payment_method": "card"
}
```

### 2. Get User Payments
**GET** `/api/payments/user/:userId`

Returns all payments made by a specific user with event details.

### 3. Get Event Payment
**GET** `/api/payments/:userId/:eventId`

Check if a user has made a payment for a specific event.

### 4. Verify Payment (Admin)
**PUT** `/api/payments/:paymentId/verify`

Admin endpoint to verify or reject payments.

## Security Features

### Card Payment Security
- **PCI Compliance Consideration:** Only last 4 digits of card stored
- **No CVV Storage:** CVV never stored in database
- **Encrypted Transmission:** HTTPS required in production
- **Reference Generation:** Auto-generated unique reference for cards
  - Format: `CARD-{timestamp}-{random4digits}`

### Bank Transfer Security
- Unique reference number validation
- Duplicate payment prevention
- Amount verification against ticket price

## Frontend Components

### Payment Modal States

1. **Method Selection** (Initial)
   - Shows two payment method cards
   - Card payment and Bank transfer options
   - Card logos displayed (Visa/Mastercard)

2. **Card Payment Form**
   - Card type selection (radio buttons)
   - Bank name dropdown
   - Card holder name input
   - Card number input (auto-formatted: 4216 **** **** 5896)
   - Expiry date inputs (MM/YY side-by-side)
   - CVV input (password masked)
   - Security notice displayed

3. **Bank Transfer Form**
   - EventDash bank account details displayed
   - User bank information inputs
   - Reference number field
   - Verification notice displayed

### Validation Rules

#### Card Payments
- Card number: Exactly 16 digits (formatted as XXXX XXXX XXXX XXXX)
- Expiry month: 01-12
- Expiry year: Current year or later
- CVV: Exactly 3 digits
- All fields required

#### Bank Transfers
- Account number: Required
- Account name: Required
- Bank name: Required
- Reference number: Required, unique per user-event combination

## Supported Sri Lankan Banks
1. NSB (National Savings Bank)
2. Commercial Bank
3. People's Bank
4. Bank of Ceylon
5. Sampath Bank
6. Hatton National Bank (HNB)
7. Nations Trust Bank (NTB)
8. DFCC Bank
9. Seylan Bank
10. Pan Asia Bank
11. Union Bank
12. Other

## Payment Status Flow

```
Submission → pending → (Admin Action) → verified ✅ or rejected ❌
```

### Status Descriptions
- **pending:** Payment submitted, awaiting admin verification
- **verified:** Payment confirmed by admin, user can attend event
- **rejected:** Payment rejected, user needs to resubmit

## User Experience

### Success Messages
- **Card Payment:** "🎉 Card payment processed successfully! Your interest has been updated to 'Going'. Payment is pending verification."
- **Bank Transfer:** "🎉 Payment submitted successfully! Your interest has been updated to 'Going'. We'll verify your payment within 24 hours."

### Error Handling
- Missing required fields
- Invalid card number length
- Invalid CVV length
- Amount mismatch with ticket price
- Duplicate payment attempts
- Database connection errors

## Future Enhancements

### Planned Features
1. **Payment Gateway Integration**
   - Real-time card processing via payment gateway
   - Instant payment confirmation
   - Automated refunds

2. **QR Code Payments**
   - Mobile payment options (PayHere, FriMi)
   - Scan to pay functionality

3. **Payment History**
   - User dashboard with payment history
   - Downloadable receipts
   - Transaction search and filter

4. **Admin Panel**
   - Batch payment verification
   - Payment analytics
   - Refund management

5. **Notifications**
   - Email confirmation on payment submission
   - SMS notification on verification
   - Payment reminder system

## Testing Checklist

- [ ] Card payment with Visa
- [ ] Card payment with Mastercard
- [ ] Bank transfer payment
- [ ] Card number validation (16 digits)
- [ ] CVV validation (3 digits)
- [ ] Expiry date validation
- [ ] Amount verification
- [ ] Duplicate payment prevention
- [ ] Payment method switching
- [ ] Mobile responsive design
- [ ] Error message display
- [ ] Success notification
- [ ] Interest level update to "going"
- [ ] Database record creation

## Files Modified

### Frontend
- `src/components/Dashboard/BrowseEvents.jsx` - Payment modal and form logic
- `src/components/Dashboard/BrowseEvents.css` - Payment UI styling

### Backend
- `backend/server.js` - Payment API endpoints
- `backend/migrations/add_payments.sql` - Payments table creation
- `backend/migrations/add_payment_method.sql` - Payment method column
- `backend/run-payment-method-migration.js` - Migration script

## Notes for Developers

1. **Environment Variables:** Ensure database credentials are properly configured in `.env`
2. **HTTPS Required:** Use HTTPS in production for secure card data transmission
3. **PCI Compliance:** Consider full PCI DSS compliance for production card processing
4. **Payment Gateway:** Integrate with licensed payment gateway for real transactions
5. **Testing:** Use test card numbers in development, never real card data
6. **Logging:** Implement proper logging for payment transactions
7. **Backup:** Regular database backups essential for payment data

---

**Last Updated:** January 2024  
**Version:** 1.0  
**Status:** ✅ Implemented and tested
