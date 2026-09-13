# Security Specification & Threat Model for Nasisi Uniforms Firestore

## 1. Data Invariants
- Products in the catalog must have a valid non-empty SKU, name, positive or zero price, and bounded string sizes.
- Storefront visitors can read published products, hero slides, and company branding settings, but cannot modify catalog items, inventory levels, or financial records.
- Inquiry tickets submitted by storefront customers can be created with strict validation, but cannot be modified or deleted except by authenticated administrative staff.
- Administrative settings, documents (Invoices, Quotations, Receipts), inventory ledgers, and transactions require administrative privileges (`isAdmin()` or bootstrapped administrator `moraasdorcah@gmail.com`).
- All document IDs must adhere to `isValidId()` regex `^[a-zA-Z0-9_\\-]+$` to prevent path injection and ID poisoning attacks.

## 2. The Dirty Dozen Attack Payloads
1. **Unauthenticated Catalog Price Tampering**: Attacker sends a PATCH to `/products/{productId}` with `basePrice: 1` without authentication -> Rejected (PERMISSION_DENIED).
2. **Ghost Field Injection in Products**: Attacker sends product create payload with hidden field `__systemAdmin: true` -> Rejected by strict key validation.
3. **ID Poisoning Attack**: Attacker attempts to create a document with a 500-byte junk character string as ID -> Rejected by `isValidId()`.
4. **Public Inquiry Hijacking**: Attacker attempts to delete `/inquiryTickets/{ticketId}` without administrative authentication -> Rejected (PERMISSION_DENIED).
5. **Unauthorized Invoice Manipulation**: Unauthenticated user attempts to update `/documents/{docId}` -> Rejected (PERMISSION_DENIED).
6. **Negative Inventory Injection**: Attacker attempts to set negative stock via invalid payload -> Rejected by validation rules.
7. **Privilege Escalation in Users**: User attempts to create an admin account with elevated role `Super Admin` -> Rejected.
8. **Shadow Update on Financial Transactions**: Unauthenticated client attempts to rewrite an M-Pesa transaction record -> Rejected.
9. **Settings Overwrite**: Client attempts to wipe business profile bank accounts -> Rejected.
10. **Arbitrary List Query Scraping on Internal Documents**: Public user attempts to run blanket query on `/documents` or `/customers` -> Rejected.
11. **Malicious Script Payload in Customer Notes**: Client injects 1MB text into customer record -> Rejected by `maxLength` and `.size()` constraints.
12. **Production Order Stage Bypass**: Public actor attempts to mark production order as dispatched -> Rejected.
