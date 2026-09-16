This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Prototype security boundary

This prototype demonstrates server-side ownership validation without a full authentication system.

**Client → Property → Asset → Incident chain**

- Every `Incident` must belong to a `Property` (`propertyId` required) and a `Client` (`clientId` required).
- `Property` must belong to the supplied `Client` (`property.clientId === client.id`). Cross-client property access is rejected with `403`.
- `Asset` (via `assetCode`) if supplied must belong to the selected `Property` (`asset.propertyId === property.id`). Cross-property asset access is rejected with `403`.
- `Client.status` must be `ACTIVE`. `INACTIVE` clients cannot submit complaints (`403`).
- Unknown `clientId` or `propertyId` returns `404`; missing fields return `400`.

```json
// Valid
{ "clientId": "client_A", "propertyId": "prop_A (belongs to client_A)", "assetId": "AC-B4-401 (belongs to prop_A)" } → 201

// Invalid
{ "clientId": "client_A", "propertyId": "prop_B (belongs to client_B)" } → 403
{ "propertyId": "prop_A", "assetId": "AC-C2-201 (belongs to prop_C)" } → 403
```

- Raw `assetId`/`assetCode` alone is **not** sufficient to create an incident.
- `propertyCode` (e.g. `PROP-BLOCK-B-001`) is a public **identifier**, not an authentication credential. Knowing a code does not prove ownership.
- The new `/complaints/new` UI enforces this by cascading selects: Client → Property → Asset (only assets of the selected property are listed).
- Production would add authenticated client accounts and session-based authorization (e.g. NextAuth, JWT) and enforce `request.user.clientId` server-side instead of trusting `clientId` from the request body. Property codes would remain identifiers with access checked against the authenticated session.

**Other hardening (prototype level):**
- Request bodies validated, relationships verified server-side, safe error messages, no stack-trace leakage, no trust in client-provided ownership claims.
