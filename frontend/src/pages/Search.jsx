import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "../components/SEO";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import { productApi } from "../services/productApi";

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    productApi
      .getAll({ search: q })
      .then((res) => setProducts(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <>
      <SEO title={`Search: ${q}`} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-brown mb-1">
            {q ? `Results for "${q}"` : "Search"}
          </h1>
          <div className="gold-line" />
        </div>
        {loading ? (
          <LoadingSpinner className="py-20" />
        ) : products.length === 0 ? (
          <EmptyState title="No results found" message={`We couldn't find anything for "${q}". Try a different keyword.`} />
        ) : (
          <>
            <p className="text-sm text-brown-light mb-6">{products.length} products found</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        )}
      </div>
    </>
  );
}
