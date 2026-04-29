import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import SEO from "../components/SEO";
import ProductCard from "../components/ProductCard";
import TrustBadges from "../components/TrustBadges";
import LoadingSpinner from "../components/LoadingSpinner";
import { productApi } from "../services/productApi";

function CategoryCard({ category }) {
  return (
    <Link
      to={`/category/${category.slug}`}
      className="group relative bg-cream rounded-2xl overflow-hidden aspect-square flex items-end p-5 hover:shadow-lg transition-all duration-300"
    >
      {category.image_url ? (
        <img
          src={category.image_url}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-cream to-beige" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-brown/70 to-transparent" />
      <div className="relative z-10">
        <h3 className="font-serif text-white text-lg font-medium">{category.name}</h3>
        <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
          Shop now <ChevronRight size={12} />
        </p>
      </div>
    </Link>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [featRes, newRes, catRes, polRes] = await Promise.all([
          productApi.getFeatured(),
          productApi.getAll({ sort: "newest", limit: 8 }),
          productApi.getCategories(),
          productApi.getExchangePolicy(),
        ]);
        setFeatured(featRes.data.data || []);
        setNewArrivals(newRes.data.data || []);
        setCategories(catRes.data.data || []);
        setPolicy(polRes.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <SEO />

      {/* Hero */}
      <section className="bg-gradient-to-br from-ivory via-cream to-beige py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/60 border border-gold-muted/30 rounded-full px-4 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-gold-muted" />
            <span className="text-xs font-medium text-gold-muted tracking-widest uppercase">
              New Collection Available
            </span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl text-brown mb-3 leading-tight">
            Baynoore
          </h1>
          <p className="text-xs md:text-sm tracking-[0.3em] text-gold-muted font-medium mb-6 uppercase">
            Modesty with Elegance
          </p>
          <div className="gold-line mx-auto mb-8" />
          <p className="text-brown-light text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Premium modest fashion delivered across Bangladesh.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/category/burka"
              className="inline-flex items-center gap-2 bg-brown text-ivory px-8 py-4 rounded-full font-medium hover:bg-brown-dark transition-colors shadow-lg"
            >
              Shop Collection
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/track-order"
              className="inline-flex items-center gap-2 border border-brown text-brown px-8 py-4 rounded-full font-medium hover:bg-cream transition-colors"
            >
              Track Order
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <TrustBadges />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-14 md:py-20 bg-ivory">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl md:text-4xl text-brown mb-2">Shop by Category</h2>
              <div className="gold-line mx-auto" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {(loading || featured.length > 0) && (
        <section className="py-14 md:py-20 bg-cream">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-brown mb-2">Featured</h2>
                <div className="gold-line" />
              </div>
              <Link to="/category/burka" className="text-sm text-gold-muted hover:text-brown flex items-center gap-1 transition-colors">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {loading ? (
              <LoadingSpinner className="py-20" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {featured.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {!loading && newArrivals.length > 0 && (
        <section className="py-14 md:py-20 bg-ivory">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-brown mb-2">New Arrivals</h2>
                <div className="gold-line" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Why Baynoore */}
      <section className="py-14 md:py-20 bg-brown text-ivory">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl mb-3">Why Baynoore?</h2>
          <p className="text-xs tracking-[0.25em] text-gold-light mb-8 uppercase">Modesty with Elegance</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { title: "Premium Quality", desc: "Every piece is carefully selected for quality, comfort, and elegance." },
              { title: "Modest & Stylish", desc: "Fashion that respects your values without compromising on style." },
              { title: "Trusted Delivery", desc: "Cash on Delivery and manual bKash across all of Bangladesh." },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="gold-line mx-auto mb-4" />
                <h3 className="font-serif text-lg mb-2 text-gold-light">{item.title}</h3>
                <p className="text-ivory/70 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exchange Policy Preview */}
      {policy && (
        <section className="py-14 md:py-20 bg-cream">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-serif text-3xl text-brown mb-2">Exchange Policy</h2>
            <div className="gold-line mx-auto mb-6" />
            <p className="text-brown-light text-sm leading-relaxed mb-6 line-clamp-2">
              {policy.content?.split("\n")[0]}
            </p>
            <Link
              to="/exchange-policy"
              className="inline-flex items-center gap-2 border border-brown text-brown px-6 py-3 rounded-full text-sm font-medium hover:bg-brown hover:text-ivory transition-colors"
            >
              Read Full Policy <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
