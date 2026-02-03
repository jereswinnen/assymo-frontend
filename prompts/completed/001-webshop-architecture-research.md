# Webshop Architecture Research & Recommendations

## Executive Summary

**Recommended approach:** Extend the existing assymo-frontend with `/shop/*` routes and use Zustand for cart state management. This leverages your existing database, auth, email infrastructure, and pricing/configurator system without adding operational complexity. The quote-based order flow you already have (`/api/configurator/submit`) can be adapted for the webshop with minimal modifications.

---

## 1. E-commerce Framework Recommendation

### Decision: Build Custom with Zustand (Not a Framework)

After evaluating headless commerce platforms (Medusa.js, Saleor, Shopify Storefront API) and e-commerce templates (Next.js Commerce, NextMerce), **none are suitable** for your use case:

#### Why Frameworks Don't Fit

| Framework | Problem |
|-----------|---------|
| **Medusa.js** | Overkill - requires separate Node.js backend, has its own product/pricing system, designed for payment-integrated flows |
| **Saleor** | Enterprise-focused, Python/GraphQL backend, complex infrastructure, monthly costs |
| **Shopify** | Requires Shopify subscription, payment processing is core to their model |
| **Next.js Commerce** | Tied to Shopify, designed around their checkout flow |
| **Commerce.js** | SaaS with monthly fees, payment-focused |

#### Your Use Case is Actually Simple

You need:
1. Display products with variants (already have `configurator_categories`, `configurator_questions` with options)
2. Fetch prices from your configurator (already have `/api/configurator/calculate`)
3. Cart state management (client-side only)
4. Submit orders without payment (adapt existing `/api/configurator/submit`)
5. Send order confirmation emails (already have `QuoteEmail` pattern)

This is not "e-commerce" in the Shopify sense - it's **quote-based ordering with a shopping cart UI**. You already built 80% of this with the configurator.

#### Recommended Libraries

```json
{
  "zustand": "^5.0.x"  // Cart state with localStorage persistence
}
```

That's it. One dependency.

**Why Zustand over react-use-cart:**
- Zustand is actively maintained (1.1M weekly downloads vs 8K for react-use-cart)
- Better TypeScript support
- You already need state management patterns (react-use-cart is unmaintained, last update 1+ year ago)
- Works seamlessly with Next.js App Router and React 19

---

## 2. Architecture Recommendation

### Decision: Option 4 - Extend assymo-frontend with `/shop/*` Routes

#### Architecture Comparison

| Option | Deployment | Complexity | Price Sync | Maintainability |
|--------|------------|------------|------------|-----------------|
| Same DB, separate app | 2 Vercel projects | Medium | Real-time (shared DB) | Two codebases to maintain |
| Separate DB with API | 2+ projects | High | API calls, latency | Most complex |
| Monorepo (Turborepo) | 2 projects, 1 repo | Medium-High | Real-time | Learning curve, overkill |
| **Extend assymo-frontend** | **1 project** | **Low** | **Real-time** | **Simplest** |

#### Why Extend the Existing App

1. **Zero deployment overhead** - Same Vercel project, same domain (or subdomain via rewrites)
2. **Direct database access** - Products, prices, categories all in same DB
3. **Reuse existing infrastructure**:
   - Email system (Resend + react-email templates)
   - Auth (Better Auth) for customer accounts if needed later
   - Image storage (Vercel Blob)
   - Multi-site support (already scoped by `site_id`)
4. **Code reuse** - Share components, types, utilities, UI primitives
5. **Single deployment pipeline** - One CI/CD, one set of env vars

#### Concerns Addressed

**"Won't this make the app too big?"**
No. Next.js code-splits automatically. Shop routes only load shop code. The admin bundle doesn't include shop code and vice versa.

**"What about auth complexity?"**
Shop is public by default. Customer accounts (if needed later) can use the same Better Auth setup with a different role/flow.

**"What if I want to separate them later?"**
The route group pattern (`(shop)`, `(admin)`, `(public)`) makes extraction straightforward. You're not locking yourself in.

#### Proposed Directory Structure

```
src/app/
  (admin)/admin/...        # Existing admin routes
  (public)/...             # Existing public routes
  (shop)/                  # New shop routes
    shop/
      page.tsx             # Shop homepage / product listing
      [category]/
        page.tsx           # Category page
        [product]/
          page.tsx         # Product detail with configurator
      winkelwagen/
        page.tsx           # Cart page
      bestelling/
        page.tsx           # Checkout (contact + order submit)
        bevestiging/
          page.tsx         # Order confirmation

src/lib/
  shop/
    cart-store.ts          # Zustand cart store
    orders.ts              # Order creation queries
    types.ts               # Shop-specific types

src/components/
  shop/
    ProductCard.tsx
    CartDrawer.tsx
    CartItem.tsx
    CheckoutForm.tsx
```

---

## 3. Pricing Integration Strategy

### Decision: Direct Database Access (Reuse Existing Configurator)

Your configurator already handles:
- Categories with slugs (`configurator_categories`)
- Configurable questions with options (`configurator_questions`)
- Price catalogue with min/max ranges (`configurator_price_catalogue`)
- Price calculation with modifiers (`calculatePrice()`)
- Quote submission with email (`/api/configurator/submit`)

#### For the Webshop

**Simple products** (no configuration):
```typescript
// Use price catalogue directly
const product = await getCatalogueItemById(siteId, productId);
// Returns: { name, price_min, price_max, unit }
```

**Configurable products** (variants/options):
```typescript
// Reuse existing configurator flow
const price = await calculatePrice({
  product_slug: "zonwering",
  answers: { type: "knikarm", width: 3, color: "wit" }
}, siteSlug);
// Returns: { min, max, breakdown }
```

#### Price Update Flow

1. Admin updates prices in `/admin/configurator/catalogue`
2. Cache invalidated via `revalidateTag(CATALOGUE_CACHE_TAG)`
3. Shop displays updated prices immediately

No API layer needed. No sync problems. Real-time consistency.

---

## 4. Order Flow (Quote-Based)

### B2B/Quote-Based Pattern

Your flow matches common B2B patterns:
1. Customer browses products, configures options
2. Adds to cart (client-side state)
3. Submits order with contact info (no payment)
4. Receives order confirmation email with payment instructions
5. Admin receives notification, processes order
6. Payment handled separately (bank transfer, invoice, etc.)

#### Proposed Order Status Workflow

```
pending → payment_instructions_sent → paid → processing → shipped → completed
                                    → cancelled
```

#### Database Schema Addition

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) NOT NULL,

  -- Customer info
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_address_street VARCHAR(255),
  customer_address_postal VARCHAR(20),
  customer_address_city VARCHAR(100),

  -- Order details
  items JSONB NOT NULL,  -- Array of { product_slug, configuration, quantity, price_min, price_max }
  subtotal_min INTEGER NOT NULL,  -- cents
  subtotal_max INTEGER NOT NULL,  -- cents
  notes TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  payment_instructions_sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_site_status ON orders(site_id, status);
CREATE INDEX idx_orders_email ON orders(customer_email);
```

#### Cart Item Structure

```typescript
interface CartItem {
  id: string;                              // Unique cart item ID
  productSlug: string;                     // configurator category slug
  productName: string;                     // Display name
  configuration: Record<string, unknown>;  // Configurator answers
  configurationSummary: string;            // Human-readable summary
  priceMin: number;                        // cents
  priceMax: number;                        // cents
  quantity: number;
}
```

#### Email Templates Needed

Adapt existing patterns:
- `OrderConfirmation.tsx` - Based on `QuoteEmail.tsx`
- `OrderAdminNotification.tsx` - Based on `QuoteAdminNotification.tsx`
- `PaymentInstructions.tsx` - New (payment details, bank account, etc.)

---

## 5. Database Decision

### Decision: Same Database

**Reasons:**
1. Price catalogue already exists and is used by configurator
2. Multi-site support already implemented (`site_id` scoping)
3. One database to backup, maintain, monitor
4. No data sync complexity
5. Transactions across orders and inventory (if needed later)

**Schema implications:**
- Add `orders` table (see above)
- Optionally add `order_items` table for normalized structure (but JSONB is fine for your scale)
- No changes to existing configurator tables

---

## 6. Detailed Implementation Plan

### Phase 1: Foundation (1-2 days)

1. **Create Zustand cart store**
   ```typescript
   // src/lib/shop/cart-store.ts
   import { create } from 'zustand';
   import { persist } from 'zustand/middleware';

   interface CartStore {
     items: CartItem[];
     addItem: (item: Omit<CartItem, 'id'>) => void;
     removeItem: (id: string) => void;
     updateQuantity: (id: string, quantity: number) => void;
     clear: () => void;
     totalItems: number;
     subtotalMin: number;
     subtotalMax: number;
   }
   ```

2. **Create orders table migration**
   - Run SQL to create `orders` table
   - Add to existing migration system or run directly

3. **Create shop route group**
   - `src/app/(shop)/shop/layout.tsx` with shop-specific header/footer
   - Basic routing structure

### Phase 2: Product Display (2-3 days)

4. **Product listing page**
   - Fetch categories from `getCategoriesForSite()`
   - Display as grid with images, names, starting prices

5. **Product detail page**
   - Embed configurator for configurable products
   - Or simple variant selector for standard products
   - "Add to cart" button with configuration

6. **Cart drawer component**
   - Slide-out drawer showing cart items
   - Quantity controls, remove button
   - Subtotal display, checkout link

### Phase 3: Checkout Flow (2-3 days)

7. **Cart page**
   - Full-page cart view
   - Edit configurations, quantities
   - Proceed to checkout

8. **Checkout page**
   - Contact form (reuse existing patterns)
   - Order summary
   - Submit order

9. **Order submission API**
   ```typescript
   // POST /api/shop/orders
   // - Validate cart items
   // - Recalculate prices server-side
   // - Create order record
   // - Send confirmation emails
   // - Clear cart
   ```

10. **Order confirmation page**
    - Success message
    - Order details
    - Payment instructions
    - "Continue shopping" link

### Phase 4: Admin & Polish (1-2 days)

11. **Admin orders list**
    - New page at `/admin/orders`
    - Filter by status
    - View order details

12. **Order detail view**
    - Customer info
    - Items with configurations
    - Status management
    - Resend emails action

13. **Email templates**
    - Create order confirmation email
    - Create admin notification email

---

## 7. What NOT to Build (YAGNI)

- **Customer accounts** - Start without. Add later if customers request order history.
- **Inventory tracking** - You're not selling physical stock from a warehouse.
- **Discounts/coupons** - Add only if marketing requests it.
- **Wishlist** - Low value, add if requested.
- **Reviews** - Not needed for custom products.
- **Search** - Category navigation is sufficient initially.

---

## 8. Summary

| Decision Area | Recommendation | Rationale |
|--------------|----------------|-----------|
| Framework | None (custom with Zustand) | Your use case is simpler than e-commerce frameworks assume |
| Architecture | Extend assymo-frontend | Simplest, leverages existing infrastructure |
| Pricing | Direct DB access | Already built, real-time sync |
| Orders | Quote-based (no payment) | Matches your business model |
| Database | Same Neon database | No sync complexity, existing multi-site |
| Cart | Zustand with localStorage | Modern, maintained, minimal |

**Total new dependencies:** 1 (zustand)
**Estimated implementation time:** 5-10 days
**Operational complexity added:** Near zero

---

## Sources

Research sources consulted:
- [Headless Commerce in 2025 - Merge](https://merge.rocks/blog/headless-commerce-in-2025-next-js-hydrogen-or-nuxt-pick-the-right-stack)
- [Medusa vs Saleor Comparison - Linearloop](https://www.linearloop.io/blog/medusa-js-vs-saleor-vs-vendure)
- [Quote-Based Ordering in B2B - KVY Technology](https://kvytechnology.com/blog/ecommerce/quote-based-ordering-in-b2b/)
- [Zustand E-commerce Tutorial - Dev.to](https://dev.to/blamsa0mine/building-a-modern-e-commerce-app-with-nextjs-15-zustand-and-typescript-18i5)
- [State Management in 2025 - Dev.to](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)
- [Next.js Commerce GitHub](https://github.com/vercel/commerce)
- [Turborepo Shared Database Setup](https://medium.com/@ajeeshRS/setting-up-a-shared-postgresql-database-in-a-turborepo-for-express-js-and-next-js-using-prisma)
- [react-use-cart npm](https://www.npmjs.com/package/react-use-cart)
