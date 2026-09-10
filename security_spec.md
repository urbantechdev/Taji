# Security Specification - TEWAW Enterprises

## 1. Data Invariants
- **Products**: Must have a non-negative price and valid image URL. Only accessible for modification by verified Admins.
- **Orders**: Every order must be linked to a customer identity or provide valid contact info. Admins manage state transitions.
- **Settings**: System-critical. Only one global document exists. Immutable by non-admins.
- **Identity**: Identity roles (Admin) are enforced via a dedicated `admins` collection check.

## 2. The Dirty Dozen Payloads
- **DP1 (Unauthorized Write)**: Non-authenticated user attempts to delete a product. (Expected: Denied)
- **DP2 (Price Poisoning)**: Setting product price to -100. (Expected: Denied)
- **DP3 (Settings Hijack)**: Attempting to change the logo URL as a regular customer. (Expected: Denied)
- **DP4 (Status Skip)**: Promoting an order from 'pending' to 'delivered' without being an admin. (Expected: Denied)
- **DP5 (Shadow Field)**: Injecting `isAdmin: true` into a message document. (Expected: Denied)
- **DP6 (Large ID)**: Using a 2KB string as a product ID to cause OOM/Cost inflation. (Expected: Denied)
- **DP7 (PII Leak)**: Regular user trying to list all orders from other customers. (Expected: Denied)
- **DP8 (Orphaned Order)**: Creating an order without any items. (Expected: Denied)
- **DP9 (Timestamp Spoof)**: Setting `createdAt` to a future date manually. (Expected: Denied)
- **DP10 (Identity Spoof)**: Setting `authorId` to the admin's UID while creating a message. (Expected: Denied)
- **DP11 (Blanket Read)**: Unauthorized listing of `/settings/` collection. (Expected: Denied)
- **DP12 (Malicious Regex)**: Using special characters in document IDs to break path parsing. (Expected: Denied)

## 3. Test Runner Logic
The `firestore.rules.test.ts` will focus on ensuring high-tier write operations are strictly restricted to the admin UID provided: `feminiholdings@gmail.com` (as per user email) and checking the `admins` collection.
