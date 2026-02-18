# ShelfVerse (React + Firebase)

A React bookstore UI where users can:
- Signup/Login with Firebase Authentication
- Browse books and add to cart
- Buy items from cart
- Generate and view printable receipt after purchase
- Store receipt/purchase data in Firestore

## 1) Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill your Firebase keys:

```bash
cp .env.example .env
```

## 2) Firebase requirements

1. Create a Firebase project.
2. Enable **Authentication > Email/Password**.
3. Create **Cloud Firestore**.
4. (Optional) Add a `books` collection with docs containing:
   - `title` (string)
   - `author` (string)
   - `price` (number)

If no books exist, the app shows fallback sample books.

## 3) Run

```bash
npm run dev
```

Run payment backend in another terminal:

```bash
npm run api
```

## 4) Razorpay Test Mode Setup

1. Create Razorpay account and switch to **Test Mode**.
2. Copy test credentials:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
3. Put them in `.env`.
4. Checkout on Cart page:
   - `UPI` / `Card` uses Razorpay
   - `COD` keeps no-gateway flow

## 5) Firestore Security Rules (tailored)

This project includes strict rules in `firestore.rules`:
- `books`: public read, admin-only write (`request.auth.token.admin == true`)
- `purchases`: owner-only create/read, no update/delete
- receipt integrity check for `createdAt`, `items`, and `total`

### Deploy rules

```bash
npm i -g firebase-tools
firebase login
firebase use aryannew-9fac8
firebase deploy --only firestore:rules
```

If you do not use admin custom claims yet, temporarily change `books` write rule to `request.auth != null` for development.

