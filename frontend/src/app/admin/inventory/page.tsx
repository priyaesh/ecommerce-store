"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { API_BASE_URL } from "@/lib/config";

type InventorySummary = {
  totalProducts: number;
  inStockProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStock: number;
};

type LowStockProduct = {
  id: string;
  name: string;
  stock: number;
  category: string;
};

export default function InventoryPage() {
  const { user, isAuthenticated, token, loading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<LowStockProduct[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [stockUpdate, setStockUpdate] = useState<{ productId: string; value: number; action: string }>({
    productId: "",
    value: 0,
    action: "set",
  });

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [isAuthenticated, loading, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin" && token) {
      fetchInventoryData();
    }
  }, [isAuthenticated, user, token]);

  const fetchInventoryData = async () => {
    try {
      setLoadingData(true);
      const [summaryRes, lowStockRes, outOfStockRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/inventory/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/inventory/low-stock?threshold=10`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/inventory/out-of-stock`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary);
      }

      if (lowStockRes.ok) {
        const data = await lowStockRes.json();
        setLowStockProducts(data.products);
      }

      if (outOfStockRes.ok) {
        const data = await outOfStockRes.json();
        setOutOfStockProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const updateStock = async (productId: string, value: number, action: string) => {
    if (!token) return;

    setUpdating(productId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/inventory/products/${productId}/stock`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ stock: value, action }),
        }
      );

      if (response.ok) {
        await fetchInventoryData();
        setStockUpdate({ productId: "", value: 0, action: "set" });
      } else {
        const error = await response.json();
        alert(error.message || "Failed to update stock");
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Failed to update stock");
    } finally {
      setUpdating(null);
    }
  };

  if (loading || loadingData) {
    return (
      <>
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-slate-600">Loading...</p>
        </div>
      </>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-white p-6 sm:p-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Inventory Management
            </h1>
            <p className="mt-2 text-slate-600">
              Monitor and manage product stock levels
            </p>
          </div>

          {summary && (
            <div className="grid gap-6 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm uppercase tracking-wide text-slate-500">
                  Total Products
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {summary.totalProducts}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm uppercase tracking-wide text-slate-500">
                  In Stock
                </p>
                <p className="mt-2 text-3xl font-semibold text-green-600">
                  {summary.inStockProducts}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <p className="text-sm uppercase tracking-wide text-amber-700">
                  Low Stock
                </p>
                <p className="mt-2 text-3xl font-semibold text-amber-600">
                  {summary.lowStockProducts}
                </p>
              </div>
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <p className="text-sm uppercase tracking-wide text-red-700">
                  Out of Stock
                </p>
                <p className="mt-2 text-3xl font-semibold text-red-600">
                  {summary.outOfStockProducts}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-amber-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Low Stock Products ({lowStockProducts.length})
              </h2>
              <div className="mt-4 space-y-3">
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {product.category} · Stock: {product.stock}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={
                            stockUpdate.productId === product.id
                              ? stockUpdate.value
                              : product.stock
                          }
                          onChange={(e) =>
                            setStockUpdate({
                              productId: product.id,
                              value: parseInt(e.target.value) || 0,
                              action: "set",
                            })
                          }
                          className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() =>
                            updateStock(
                              product.id,
                              stockUpdate.productId === product.id
                                ? stockUpdate.value
                                : product.stock,
                              "set"
                            )
                          }
                          disabled={updating === product.id}
                          className="rounded bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:bg-slate-400"
                        >
                          {updating === product.id ? "Updating..." : "Update"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No low stock products</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-red-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Out of Stock Products ({outOfStockProducts.length})
              </h2>
              <div className="mt-4 space-y-3">
                {outOfStockProducts.length > 0 ? (
                  outOfStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {product.category} · Stock: 0
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={
                            stockUpdate.productId === product.id
                              ? stockUpdate.value
                              : 0
                          }
                          onChange={(e) =>
                            setStockUpdate({
                              productId: product.id,
                              value: parseInt(e.target.value) || 0,
                              action: "set",
                            })
                          }
                          className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() =>
                            updateStock(
                              product.id,
                              stockUpdate.productId === product.id
                                ? stockUpdate.value
                                : 0,
                              "set"
                            )
                          }
                          disabled={updating === product.id}
                          className="rounded bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:bg-slate-400"
                        >
                          {updating === product.id ? "Updating..." : "Restock"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">All products in stock</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

