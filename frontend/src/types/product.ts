export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  rating: number;
  reviews: number;
  tagline: string;
  stock: number;
  colors: string[];
  image: string;
  badge?: string;
  description: string;
  features: string[];
};

export type ProductResponse = {
  data: Product[];
  meta: {
    total: number;
    categories: string[];
    featuredCount: number;
  };
};

