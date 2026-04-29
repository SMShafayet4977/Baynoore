import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingBag, MessageCircle, Truck, RefreshCw } from "lucide-react";
import SEO from "../components/SEO";
import ImageGallery from "../components/ImageGallery";
import Price from "../components/Price";
import StockBadge from "../components/StockBadge";
import QuantitySelector from "../components/QuantitySelector";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { useCart } from "../context/CartContext";
import { useToast } from "../components/Toast";
import { productApi } from "../services/productApi";
import { whatsappProductLink } from "../utils/whatsapp";

export default function ProductDetails() {
  const { slug } = useParams();
  const { addItem, openDrawer } = useCart();
  const { addToast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setLoading(true);
    setSelectedSize("");
    setSelectedColor("");
    setQuantity(1);
    productApi
      .getBySlug(slug)
      .then((res) => setProduct(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner className="min-h-screen" />;
  if (!product) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-brown-light">Product not found.</p>
    </div>
  );

  const sizes = [...new Set(product.variants?.map((v) => v.size).filter(Boolean))];
  const colors = [...new Set(product.variants?.map((v) => v.color).filter(Boolean))];

  const selectedVariant = product.variants?.find(
    (v) =>
      (!selectedSize || v.size === selectedSize) &&
      (!selectedColor || v.color === selectedColor)
  );

  const stock = selectedVariant?.stock_quantity ?? 0;
  const price = product.sale_price && Number(product.sale_price) < Number(product.regular_price)
    ? Number(product.sale_price)
    : Number(product.regular_price);

  function handleAddToCart(buyNow = false) {
    if (sizes.length > 0 && !selectedSize) {
      addToast("Please select a size", "warning");
      return;
    }
    if (colors.length > 0 && !selectedColor) {
      addToast("Please select a color", "warning");
      return;
    }
    if (!selectedVariant) {
      addToast("Please select a valid variant", "warning");
      return;
    }
    if (stock === 0) {
      addToast("This variant is out of stock", "error");
      return;
    }
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      slug: product.slug,
      name: product.name,
      productCode: product.product_code,
      image: product.images?.[0]?.image_url,
      size: selectedSize,
      color: selectedColor,
      price,
      quantity,
      stock,
    });
    addToast("Added to cart!", "success");
    if (buyNow) {
      openDrawer();
    }
  }

  return (
    <>
      <SEO
        title={product.name}
        description={product.short_description || `${product.name} - Premium modest fashion by Baynoore`}
        image={product.images?.[0]?.image_url}
        type="product"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div>
            <ImageGallery images={product.images || []} productName={product.name} />
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div>
              <p className="text-xs text-brown-light mb-1">{product.product_code}</p>
              <h1 className="font-serif text-2xl md:text-3xl text-brown leading-snug">{product.name}</h1>
              <p className="text-xs text-gold-muted tracking-widest mt-1">BAYNOORE | MODESTY WITH ELEGANCE</p>
            </div>

            <div className="flex items-center gap-4">
              <Price regular={product.regular_price} sale={product.sale_price} size="xl" />
              <StockBadge stock={stock} />
            </div>

            {product.short_description && (
              <p className="text-brown-light text-sm leading-relaxed">{product.short_description}</p>
            )}

            {/* Size selector */}
            {sizes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-brown mb-2">Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                        selectedSize === s
                          ? "border-brown bg-brown text-ivory"
                          : "border-beige text-brown hover:border-brown"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color selector */}
            {colors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-brown mb-2">Color</p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                        selectedColor === c
                          ? "border-brown bg-brown text-ivory"
                          : "border-beige text-brown hover:border-brown"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-sm font-medium text-brown mb-2">Quantity</p>
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={Math.max(1, stock)}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleAddToCart(false)}
                disabled={stock === 0}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-brown text-brown py-3.5 rounded-xl font-medium hover:bg-brown hover:text-ivory transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag size={18} />
                Add to Cart
              </button>
              <button
                onClick={() => handleAddToCart(true)}
                disabled={stock === 0}
                className="flex-1 bg-brown text-ivory py-3.5 rounded-xl font-medium hover:bg-brown-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            {/* WhatsApp */}
            <a
              href={whatsappProductLink(product.product_code)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-green-300 text-green-700 py-3 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors"
            >
              <MessageCircle size={16} />
              Ask on WhatsApp
            </a>

            {/* Product info */}
            <div className="border-t border-beige pt-5 space-y-3">
              {product.fabric && (
                <div className="flex gap-3 text-sm">
                  <span className="text-brown-light w-28 shrink-0">Fabric</span>
                  <span className="text-brown">{product.fabric}</span>
                </div>
              )}
              {product.care_instruction && (
                <div className="flex gap-3 text-sm">
                  <span className="text-brown-light w-28 shrink-0">Care</span>
                  <span className="text-brown">{product.care_instruction}</span>
                </div>
              )}
              <div className="flex gap-3 text-sm">
                <Truck size={16} className="text-gold-muted shrink-0 mt-0.5" />
                <span className="text-brown-light">Chattogram ৳80 · Outside Chattogram ৳130</span>
              </div>
              <div className="flex gap-3 text-sm">
                <RefreshCw size={16} className="text-gold-muted shrink-0 mt-0.5" />
                <Link to="/exchange-policy" className="text-gold-muted hover:underline">
                  7-day exchange policy
                </Link>
              </div>
            </div>

            {product.full_description && (
              <div className="border-t border-beige pt-5">
                <h3 className="font-serif text-base text-brown mb-2">Description</h3>
                <p className="text-brown-light text-sm leading-relaxed whitespace-pre-line">
                  {product.full_description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {product.related_products?.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-2xl text-brown mb-2">You May Also Like</h2>
            <div className="gold-line mb-8" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {product.related_products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
