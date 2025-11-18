"use client";

import Image from "next/image";
import { useMemo, useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/lib/config";
import { StripeCheckout } from "@/components/payment/StripeCheckout";
import type { Product } from "@/types/product";

type StorefrontProps = {
  products: Product[];
  featured: Product[];
  categories: string[];
};

type CartState = Record<string, number>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

const shippingRate = 24;
const taxRate = 0.08;

// Get cart key based on user ID (or "guest" for non-authenticated users)
const getCartKey = (userId: string | null): string => {
  return userId ? `cart_${userId}` : "cart_guest";
};

export function Storefront({
  products: initialProducts,
  featured: initialFeatured,
  categories,
}: StorefrontProps) {
  const { token, user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [featured, setFeatured] = useState<Product[]>(initialFeatured);
  const [cart, setCart] = useState<CartState>({});
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<Array<{ id: string; quantity: number }>>([]);
  const previousUserIdRef = useRef<string | null>(null);
  const loadEffectPreviousUserIdRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);

  // Update products when initialProducts change (e.g., from server refresh)
  useEffect(() => {
    setProducts(initialProducts);
    setFeatured(initialFeatured);
  }, [initialProducts, initialFeatured]);

  // Handle logout - save cart when user logs out
  useEffect(() => {
    const currentUserId = user?.id || null;
    const previousUserId = previousUserIdRef.current;
    
    // Check if user is logging out (had a user ID, now null)
    const isLoggingOut = previousUserId && previousUserId !== null && !currentUserId;
    
    if (isLoggingOut && Object.keys(cart).length > 0) {
      // User is logging out - save cart to user's key and guest cart
      const oldCartKey = getCartKey(previousUserId);
      localStorage.setItem(oldCartKey, JSON.stringify(cart));
      localStorage.setItem("cart_guest", JSON.stringify(cart));
      // Keep cart visible - don't clear it
    }
    
    // Update ref after handling logout
    previousUserIdRef.current = currentUserId;
  }, [user?.id, cart]); // Include cart to access current cart state

  // Load user-specific cart when user changes or component mounts
  useEffect(() => {
    const cartKey = getCartKey(user?.id || null);
    const savedCart = localStorage.getItem(cartKey);
    
    // Clean up old "cart" key if it exists (migration from old system)
    if (localStorage.getItem("cart") && !user?.id) {
      // Migrate old guest cart to new key
      const oldCart = localStorage.getItem("cart");
      if (oldCart) {
        try {
          localStorage.setItem("cart_guest", oldCart);
        } catch (error) {
          console.error("Error migrating old cart:", error);
        }
      }
      localStorage.removeItem("cart");
    }
    
    // Check if user is logging out - if so, keep current cart visible
    // Use a separate ref that tracks the previous user ID for this effect
    const previousUserId = loadEffectPreviousUserIdRef.current;
    const isLoggingOut = !isInitialMountRef.current && previousUserId && previousUserId !== null && !user?.id;
    
    if (isLoggingOut) {
      // User is logging out - keep current cart visible, don't switch to guest cart
      isInitialMountRef.current = false;
      loadEffectPreviousUserIdRef.current = user?.id || null;
      return; // Don't load anything, keep current cart
    }
    
    // User is logging in or component is mounting - load their cart
    // Priority: Database cart > localStorage cart > empty
    const loadCart = async () => {
      let finalCart: CartState = {};

      // If user is logged in, try to load from database first
      if (user?.id && token) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/cart`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.cart && Object.keys(data.cart).length > 0) {
              finalCart = data.cart;
            }
          }
        } catch (error) {
          console.error("Error loading cart from database:", error);
          // Fall back to localStorage
        }
      }

      // If no database cart, try localStorage
      if (Object.keys(finalCart).length === 0 && savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          finalCart = parsedCart;
        } catch (error) {
          console.error("Error parsing localStorage cart:", error);
        }
      }

      // Validate cart items - only keep products that still exist and are in stock
      const validCart: CartState = {};
      Object.entries(finalCart).forEach(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId);
        const qty = typeof quantity === "number" ? quantity : 0;
        if (product && qty > 0) {
          // Limit quantity to available stock
          validCart[productId] = Math.min(qty, product.stock);
        }
      });

      setCart(validCart);

      // Update localStorage with validated cart
      if (Object.keys(validCart).length > 0) {
        localStorage.setItem(cartKey, JSON.stringify(validCart));
      } else {
        localStorage.removeItem(cartKey);
      }
    };

    if (user?.id && token) {
      // User is logged in - load from database or localStorage
      loadCart().catch((error) => {
        console.error("Error loading cart:", error);
        // Fallback to localStorage if database fails
        if (savedCart) {
          try {
            const parsedCart = JSON.parse(savedCart);
            const validCart: CartState = {};
            Object.entries(parsedCart).forEach(([productId, quantity]) => {
              const product = products.find((p) => p.id === productId);
              const qty = typeof quantity === "number" ? quantity : 0;
              if (product && qty > 0) {
                validCart[productId] = qty;
              }
            });
            setCart(validCart);
          } catch (parseError) {
            console.error("Error parsing localStorage cart:", parseError);
            setCart({});
          }
        }
      });
    } else if (savedCart) {
      // Guest user - load from localStorage
      try {
        const parsedCart = JSON.parse(savedCart);
        const validCart: CartState = {};
        Object.entries(parsedCart).forEach(([productId, quantity]) => {
          const product = products.find((p) => p.id === productId);
          const qty = typeof quantity === "number" ? quantity : 0;
          if (product && qty > 0) {
            // Limit quantity to available stock
            validCart[productId] = Math.min(qty, product.stock);
          }
        });
        setCart(validCart);
        if (Object.keys(validCart).length > 0) {
          localStorage.setItem(cartKey, JSON.stringify(validCart));
        } else {
          localStorage.removeItem(cartKey);
        }
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
        localStorage.removeItem(cartKey);
        setCart({});
      }
    } else if (user?.id) {
      // User is logging in but has no saved cart - start with empty cart
      setCart({});
    }
    // If no user and no saved cart, keep current cart (might be guest cart)
    
    // Mark that initial mount is complete and update ref
    isInitialMountRef.current = false;
    loadEffectPreviousUserIdRef.current = user?.id || null;
  }, [user?.id, products, token]);

  // Save cart to localStorage and optionally to database
  useEffect(() => {
    const cartKey = getCartKey(user?.id || null);
    
    // Always save to localStorage
    if (Object.keys(cart).length > 0) {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } else {
      // Remove from localStorage if cart is empty
      localStorage.removeItem(cartKey);
    }

    // If user is logged in, also save to database (optional sync)
    if (token && user?.id && Object.keys(cart).length > 0) {
      // Debounce database saves - only save after user stops making changes
      const saveToDatabase = async () => {
        try {
          await fetch(`${API_BASE_URL}/api/auth/cart`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ cart }),
          });
        } catch (error) {
          // Silently fail - localStorage is the primary storage
          console.error("Failed to save cart to database:", error);
        }
      };

      // Debounce: wait 1 second after last cart change before saving to database
      const timeoutId = setTimeout(saveToDatabase, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [cart, user?.id, token]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.tagline.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const cartItems = Object.entries(cart)
    .map(([id, quantity]) => {
      const product = products.find((item) => item.id === id);
      if (!product) {
        return null;
      }

      return { product, quantity };
    })
    .filter(Boolean) as { product: Product; quantity: number }[];

  const subtotal = cartItems.reduce(
    (sum, { product, quantity }) => sum + product.price * quantity,
    0
  );
  const shipping = subtotal === 0 || subtotal >= 400 ? 0 : shippingRate;
  const tax = subtotal * taxRate;
  const total = subtotal + shipping + tax;

  const updateCart = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Check stock availability
    if (quantity > product.stock) {
      // Limit quantity to available stock
      quantity = product.stock;
    }

    setCart((prev) => {
      if (quantity <= 0) {
        const nextCart = { ...prev };
        delete nextCart[productId];
        return nextCart;
      }
      return { ...prev, [productId]: quantity };
    });
  };

  const handleCheckoutClick = () => {
    if (!cartItems.length) return;
    
    // Capture current cart items for checkout
    const itemsToCheckout = cartItems.map(({ product, quantity }) => ({
      id: product.id,
      quantity,
    }));
    
    setCheckoutItems(itemsToCheckout);
    setShowPaymentModal(true);
    setCheckoutMessage(null);
  };

  const handlePaymentSuccess = async (orderId: string, stockUpdates?: Array<{ productId: string; newStock: number }>) => {
    setCheckoutMessage(`Order ${orderId} confirmed! Inventory updated. ETA 3-5 business days`);
    
    // Update product stock levels in real-time without refresh
    if (stockUpdates && stockUpdates.length > 0) {
      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          const update = stockUpdates.find((u) => u.productId === product.id);
          if (update) {
            return { ...product, stock: update.newStock };
          }
          return product;
        })
      );
      
      setFeatured((prevFeatured) =>
        prevFeatured.map((product) => {
          const update = stockUpdates.find((u) => u.productId === product.id);
          if (update) {
            return { ...product, stock: update.newStock };
          }
          return product;
        })
      );
    }
    
    // Clear cart state immediately
    setCart({});
    
    // Clear user-specific cart from localStorage
    const cartKey = getCartKey(user?.id || null);
    localStorage.removeItem(cartKey);
    
    // Clear database cart for logged-in users
    if (token && user?.id) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/cart`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cart: {} }),
        });
      } catch (error) {
        console.error("Error clearing database cart:", error);
        // Non-critical error, continue anyway
      }
    }
    
    setShowPaymentModal(false);
    
    // No page refresh needed - inventory is updated in real-time!
  };

  const handlePaymentError = (error: string) => {
    setCheckoutMessage(error);
    // Keep modal open so user can retry
  };

  return (
    <div className="space-y-12">
      <section className="grid gap-10 rounded-3xl bg-white/80 p-8 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.5)] ring-1 ring-slate-100 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1 text-sm font-medium text-teal-700">
            New drop · conscious materials
          </p>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">
              Build a home you love with thoughtful design essentials.
            </h1>
            <p className="text-lg text-slate-600">
              Curated furniture, lighting, and tableware crafted in small
              batches. Transparent pricing, rapid shipping, zero compromise.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Shop new arrivals
            </button>
            <button className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50">
              Explore lookbook
            </button>
          </div>
        </div>
        <div className="space-y-6 rounded-3xl bg-slate-900 p-6 text-white">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-teal-200">
              Spotlight
            </p>
            <h2 className="text-3xl font-semibold leading-tight">
              Elevated essentials that pair with everything.
            </h2>
            <p className="text-slate-200">
              Designed with modular silhouettes and neutral palettes. Mix,
              layer, repeat.
            </p>
          </div>
          <div className="grid gap-4">
            {featured.map((product) => (
              <article
                key={product.id}
                className="flex items-start gap-4 rounded-2xl bg-white/5 p-4"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-slate-200">{product.tagline}</p>
                </div>
                <p className="font-semibold">{formatCurrency(product.price)}</p>
              </article>
            ))}
          </div>
          <p className="text-sm text-slate-300">
            Free carbon-neutral shipping on orders above $400.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {["All", ...categories].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === category
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-1 justify-end">
            <div className="w-full max-w-xs">
              <label className="sr-only" htmlFor="search">
                Search products
              </label>
              <input
                id="search"
                type="search"
                placeholder="Search furniture, lighting..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-full border border-slate-200 px-5 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-6 md:grid-cols-2">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  {product.badge && (
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">
                      {product.badge}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-4 p-6">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      {product.category}
                    </p>
                    <h3 className="text-xl font-semibold text-slate-900">
                      {product.name}
                    </h3>
                    <p className="text-sm text-slate-500">{product.tagline}</p>
                  </div>
                  <ul className="space-y-1 text-sm text-slate-500">
                    {product.features.slice(0, 3).map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-semibold text-slate-900">
                          {formatCurrency(product.price)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.rating} · {product.reviews} reviews
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {product.stock === 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-red-600">
                            Out of Stock
                          </p>
                          <button
                            disabled
                            className="w-full rounded-full bg-slate-300 px-5 py-2 text-sm font-semibold text-slate-500 cursor-not-allowed"
                          >
                            Out of Stock
                          </button>
                        </div>
                      ) : product.stock <= 10 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-amber-600">
                            Only {product.stock} left in stock
                          </p>
                          <button
                            onClick={() =>
                              updateCart(
                                product.id,
                                (cart[product.id] ?? 0) + 1
                              )
                            }
                            disabled={(cart[product.id] ?? 0) >= product.stock}
                            className="w-full rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                          >
                            {(cart[product.id] ?? 0) >= product.stock
                              ? "Max quantity reached"
                              : "Add to cart"}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            updateCart(
                              product.id,
                              (cart[product.id] ?? 0) + 1
                            )
                          }
                          className="w-full rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                          Add to cart
                        </button>
                      )}
                      {product.stock > 0 && product.stock > 10 && (
                        <p className="text-xs text-slate-500 text-center">
                          {product.stock} in stock
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {!filteredProducts.length && (
              <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center">
                <p className="text-lg font-semibold text-slate-700">
                  No products found
                </p>
                <p className="text-sm text-slate-500">
                  Try adjusting your filters to discover more pieces.
                </p>
              </div>
            )}
          </div>

          <aside className="h-fit space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                  Your cart
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {cartItems.length} items
                </p>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                Ships in 2 days
              </span>
            </div>

            <div className="space-y-4">
              {cartItems.length ? (
                cartItems.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4"
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-500">{product.tagline}</p>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-3 text-sm">
                          <label className="text-xs uppercase text-slate-400">
                            Qty
                          </label>
                          <div className="flex items-center rounded-full border border-slate-200">
                            <button
                              onClick={() =>
                                updateCart(product.id, quantity - 1)
                              }
                              className="px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              –
                            </button>
                            <p className="px-4 text-sm font-semibold text-slate-900">
                              {quantity}
                            </p>
                            <button
                              onClick={() =>
                                updateCart(product.id, quantity + 1)
                              }
                              disabled={quantity >= product.stock}
                              className="px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        {product.stock < quantity && (
                          <p className="text-xs font-semibold text-red-600">
                            Only {product.stock} available (cart updated)
                          </p>
                        )}
                        {product.stock > 0 && product.stock <= 10 && (
                          <p className="text-xs text-amber-600">
                            {product.stock} left in stock
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(product.price * quantity)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                  <p className="text-sm font-semibold text-slate-600">
                    Your cart is empty
                  </p>
                  <p className="text-xs text-slate-400">
                    Add products to preview totals.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-2xl bg-slate-50 p-5">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? "Free" : formatCurrency(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-4 text-lg font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <button
                disabled={!cartItems.length}
                onClick={handleCheckoutClick}
                className="mt-4 w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition enabled:hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Checkout securely
              </button>
              {checkoutMessage && (
                <p className={`text-center text-xs ${
                  checkoutMessage.includes("confirmed") 
                    ? "text-green-600" 
                    : "text-red-600"
                }`}>
                  {checkoutMessage}
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Drop Studio™",
              body: "Limited capsule collections with independent designers every quarter.",
            },
            {
              title: "60-day trial",
              body: "Test furniture at home. If it doesn't spark joy, we take it back—no fees.",
            },
            {
              title: "Responsible sourcing",
              body: "FSC-certified wood, low-VOC finishes, and planet-first supply partners.",
            },
          ].map((cta) => (
            <article key={cta.title} className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">
                {cta.title}
              </h3>
              <p className="text-sm text-slate-500">{cta.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-900">
                Complete Payment
              </h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6 space-y-2 rounded-lg bg-slate-50 p-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? "Free" : formatCurrency(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {checkoutItems.length > 0 ? (
              <StripeCheckout
                amount={total}
                email={user?.email || "guest@shopper.com"}
                items={checkoutItems}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                token={token}
              />
            ) : (
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <p className="text-sm text-red-600">Cart is empty. Please add items to your cart.</p>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

