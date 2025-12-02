# Using Payload Ecommerce Frontend in Astro

## The Core Problem

Payload's `EcommerceProvider` and `useCart` are **React Context-based**. Astro's island architecture means React components hydrate in isolation—they **cannot share React Context** across islands.

From Astro docs:
> "UI frameworks like React or Vue may encourage 'context' providers for other components to consume. But when partially hydrating components within Astro or Markdown, you can't use these context wrappers."

## The Solution: Nano Stores

Astro officially recommends **Nano Stores** for sharing state between islands. This is a framework-agnostic state library that works across React, Vue, Svelte, etc.

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│  Astro Page                                             │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ AddToCart.tsx   │  │ CartFlyout.tsx  │              │
│  │ client:load     │  │ client:load     │              │
│  │                 │  │                 │              │
│  │ useStore(cart)  │  │ useStore(cart)  │              │
│  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                        │
│           └────────┬───────────┘                        │
│                    ▼                                    │
│           ┌────────────────┐                            │
│           │  Nano Store    │                            │
│           │  (cartStore)   │                            │
│           └────────────────┘                            │
│                    │                                    │
│                    ▼                                    │
│           ┌────────────────┐                            │
│           │ Payload API    │                            │
│           │ /api/carts     │                            │
│           └────────────────┘                            │
└─────────────────────────────────────────────────────────┘
```

## Implementation Guide

### Step 1: Install Dependencies

```bash
npm install nanostores @nanostores/react
```

### Step 2: Create Cart Store

Create `src/stores/cartStore.ts`:

```typescript
import { atom, map } from 'nanostores'

// Types matching Payload ecommerce Cart
export type CartItem = {
  id: string
  product: string | { id: string; title: string; price: number }
  quantity: number
  variant?: string
}

export type Cart = {
  id?: string
  items: CartItem[]
  totals?: {
    subtotal: number
    total: number
  }
}

// Store state
export const cart = atom<Cart | null>(null)
export const isCartOpen = atom(false)
export const isLoading = atom(false)

// API base URL for your Payload backend
const API_URL = import.meta.env.PUBLIC_PAYLOAD_URL || 'http://localhost:3000'

// Initialize cart from localStorage or API
export async function initCart() {
  // Try localStorage first
  const stored = localStorage.getItem('cart')
  if (stored) {
    cart.set(JSON.parse(stored))
  }

  // Optionally sync with server for logged-in users
  // await syncCartWithServer()
}

// Add item to cart
export async function addItem(productId: string, quantity = 1, variantId?: string) {
  isLoading.set(true)

  const currentCart = cart.get() || { items: [] }
  const existingIndex = currentCart.items.findIndex(
    item => (typeof item.product === 'string' ? item.product : item.product.id) === productId
  )

  if (existingIndex >= 0) {
    currentCart.items[existingIndex].quantity += quantity
  } else {
    currentCart.items.push({
      id: crypto.randomUUID(),
      product: productId,
      quantity,
      variant: variantId,
    })
  }

  cart.set({ ...currentCart })
  localStorage.setItem('cart', JSON.stringify(currentCart))
  isLoading.set(false)

  // Optionally sync to Payload API
  // await syncCartToServer(currentCart)
}

// Remove item from cart
export function removeItem(itemId: string) {
  const currentCart = cart.get()
  if (!currentCart) return

  currentCart.items = currentCart.items.filter(item => item.id !== itemId)
  cart.set({ ...currentCart })
  localStorage.setItem('cart', JSON.stringify(currentCart))
}

// Increment item quantity
export function incrementItem(itemId: string) {
  const currentCart = cart.get()
  if (!currentCart) return

  const item = currentCart.items.find(i => i.id === itemId)
  if (item) {
    item.quantity += 1
    cart.set({ ...currentCart })
    localStorage.setItem('cart', JSON.stringify(currentCart))
  }
}

// Decrement item quantity
export function decrementItem(itemId: string) {
  const currentCart = cart.get()
  if (!currentCart) return

  const item = currentCart.items.find(i => i.id === itemId)
  if (item) {
    item.quantity -= 1
    if (item.quantity <= 0) {
      removeItem(itemId)
    } else {
      cart.set({ ...currentCart })
      localStorage.setItem('cart', JSON.stringify(currentCart))
    }
  }
}

// Clear entire cart
export function clearCart() {
  cart.set({ items: [] })
  localStorage.removeItem('cart')
}

// Toggle cart visibility
export function toggleCart() {
  isCartOpen.set(!isCartOpen.get())
}
```

### Step 3: Create React Components as Islands

Create `src/components/AddToCartButton.tsx`:

```tsx
import { useStore } from '@nanostores/react'
import { addItem, isLoading } from '../stores/cartStore'

interface Props {
  productId: string
  productName: string
  variantId?: string
}

export default function AddToCartButton({ productId, productName, variantId }: Props) {
  const $isLoading = useStore(isLoading)

  const handleClick = () => {
    addItem(productId, 1, variantId)
  }

  return (
    <button
      onClick={handleClick}
      disabled={$isLoading}
      className="add-to-cart-btn"
    >
      {$isLoading ? 'Adding...' : `Add ${productName} to Cart`}
    </button>
  )
}
```

Create `src/components/CartFlyout.tsx`:

```tsx
import { useStore } from '@nanostores/react'
import { cart, isCartOpen, toggleCart, removeItem, incrementItem, decrementItem } from '../stores/cartStore'

export default function CartFlyout() {
  const $cart = useStore(cart)
  const $isOpen = useStore(isCartOpen)

  if (!$isOpen) return null

  return (
    <aside className="cart-flyout">
      <header>
        <h2>Your Cart</h2>
        <button onClick={toggleCart}>Close</button>
      </header>

      {$cart?.items.length ? (
        <ul>
          {$cart.items.map(item => (
            <li key={item.id}>
              <span>Product: {typeof item.product === 'string' ? item.product : item.product.title}</span>
              <span>Qty: {item.quantity}</span>
              <button onClick={() => decrementItem(item.id)}>-</button>
              <button onClick={() => incrementItem(item.id)}>+</button>
              <button onClick={() => removeItem(item.id)}>Remove</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Your cart is empty!</p>
      )}
    </aside>
  )
}
```

Create `src/components/CartToggle.tsx`:

```tsx
import { useStore } from '@nanostores/react'
import { cart, toggleCart } from '../stores/cartStore'

export default function CartToggle() {
  const $cart = useStore(cart)
  const itemCount = $cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0

  return (
    <button onClick={toggleCart} className="cart-toggle">
      Cart ({itemCount})
    </button>
  )
}
```

### Step 4: Use in Astro Pages

In `src/pages/product/[slug].astro`:

```astro
---
import Layout from '../../layouts/Layout.astro'
import AddToCartButton from '../../components/AddToCartButton'
import CartFlyout from '../../components/CartFlyout'
import CartToggle from '../../components/CartToggle'

// Fetch product from Payload API
const { slug } = Astro.params
const res = await fetch(`${import.meta.env.PAYLOAD_URL}/api/products?where[slug][equals]=${slug}`)
const { docs } = await res.json()
const product = docs[0]
---

<Layout>
  <header>
    <CartToggle client:load />
  </header>

  <main>
    <h1>{product.title}</h1>
    <p>{product.description}</p>
    <p>Price: ${product.price / 100}</p>

    <AddToCartButton
      client:load
      productId={product.id}
      productName={product.title}
    />
  </main>

  <CartFlyout client:load />
</Layout>

<script>
  import { initCart } from '../stores/cartStore'
  initCart()
</script>
```

### Step 5: Initialize Cart on App Load

In your main layout `src/layouts/Layout.astro`:

```astro
---
// ...props
---
<html>
  <head>...</head>
  <body>
    <slot />

    <script>
      import { initCart } from '../stores/cartStore'

      // Initialize cart when page loads
      document.addEventListener('DOMContentLoaded', () => {
        initCart()
      })
    </script>
  </body>
</html>
```

## Key Differences from Next.js/React Usage

| Payload + Next.js | Payload + Astro |
|-------------------|-----------------|
| Wrap app in `<EcommerceProvider>` | No provider needed |
| Use `useCart()` hook directly | Use `useStore(cart)` from Nano Stores |
| Context shared automatically | State shared via Nano Stores |
| SSR hydration built-in | Use `client:load` directive |

## Syncing with Payload API (Optional)

For authenticated users, you may want to sync the local cart with Payload's cart collection:

```typescript
// In cartStore.ts
export async function syncCartWithServer() {
  try {
    const res = await fetch(`${API_URL}/api/carts/me`, {
      credentials: 'include',
    })
    if (res.ok) {
      const serverCart = await res.json()
      cart.set(serverCart)
      localStorage.setItem('cart', JSON.stringify(serverCart))
    }
  } catch (e) {
    console.error('Failed to sync cart:', e)
  }
}

export async function syncCartToServer(cartData: Cart) {
  try {
    await fetch(`${API_URL}/api/carts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(cartData),
    })
  } catch (e) {
    console.error('Failed to save cart:', e)
  }
}
```

## Summary

1. **You cannot use `EcommerceProvider`** directly in Astro because React Context doesn't work across islands
2. **Use Nano Stores** as the official Astro-recommended solution for cross-island state
3. **Re-implement cart logic** using Nano Stores, calling Payload's REST API directly
4. **Each React component** becomes an island with `client:load` (or `client:visible`, etc.)
5. **All islands share state** through the Nano Store, not React Context
