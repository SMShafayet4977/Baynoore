import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SEO from "../components/SEO";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import { productApi } from "../services/productApi";

export default function CategoryPage() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");

  const categoryName = slug
    ? slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "Category";

  useEffect(() => {
    setLoading(true);
    productApi
      .getByCategory(slug, { sort })
      .then((res) => setProducts(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, sort]);

  return (
    <>
      <SEO title={categoryName} description={`Shop ${categoryName} at Baynoore. Premium modest fashion in Bangladesh.`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-brown mb-2">{categoryName}</h1>
          <div className="gold-line" />
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-brown-light">{products.length} products</p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-beige rounded-xl px-3 py-2 text-sm text-brown bg-white focus:outline-none focus:border-gold-muted"
          >
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner className="py-20" />
        ) : products.length === 0 ? (
          <EmptyState title="No products found" message="Check back soon for new arrivals." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </>
  );
}
