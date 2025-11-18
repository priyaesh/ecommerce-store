import { Storefront } from "@/components/storefront/Storefront";
import { Header } from "@/components/layout/Header";
import { API_BASE_URL } from "@/lib/config";
import type { ProductResponse } from "@/types/product";

async function fetchProducts(
  params: Record<string, string> = {}
): Promise<ProductResponse> {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(
    `${API_BASE_URL}/api/products${query ? `?${query}` : ""}`,
    {
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load products");
  }

  return response.json();
}

export default async function HomePage() {
  const [allProducts, featuredProducts] = await Promise.all([
    fetchProducts(),
    fetchProducts({ featured: "true" }),
  ]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-white p-6 sm:p-10">
        <div className="mx-auto max-w-6xl space-y-16">
          <Storefront
            products={allProducts.data}
            featured={featuredProducts.data}
            categories={allProducts.meta.categories}
          />
        </div>
      </main>
    </>
  );
}
