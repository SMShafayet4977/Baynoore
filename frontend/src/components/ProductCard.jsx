import { Link } from "react-router-dom";
import { ShoppingBag, Eye } from "lucide-react";
import Price from "./Price";
import StockBadge from "./StockBadge";

export default function ProductCard({ product }) {
  const {
    name,
    slug,
    product_code,
    regular_price,
    sale_price,
    primary_image,
    stock_quantity,
  } = product;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <Link to={`/product/${slug}`} className="block relative overflow-hidden bg-cream">
        <div className="aspect-product">
          {primary_image ? (
            <img
              src={primary_image}
              alt={`${name} - Baynoore`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-cream">
              <ShoppingBag size={40} className="text-beige" />
            </div>
          )}
        </div>
        {sale_price && Number(sale_price) < Number(regular_price) && (
          <span className="absolute top-3 left-3 bg-gold-muted text-white text-xs font-semibold px-2 py-1 rounded-full">
            Sale
          </span>
        )}
        {Number(stock_quantity) === 0 && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-white text-brown text-xs font-semibold px-3 py-1.5 rounded-full shadow">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-brown-light mb-1">{product_code}</p>
        <h3 className="font-serif text-sm font-medium text-brown line-clamp-2 mb-2 leading-snug">
          {name}
        </h3>
        <div className="flex items-center justify-between mb-3">
          <Price regular={regular_price} sale={sale_price} size="sm" />
          <StockBadge stock={Number(stock_quantity)} />
        </div>
        <Link
          to={`/product/${slug}`}
          className="flex items-center justify-center gap-2 w-full bg-brown text-ivory py-2.5 rounded-xl text-xs font-medium hover:bg-brown-dark transition-colors"
        >
          <Eye size={14} />
          View Details
        </Link>
      </div>
    </div>
  );
}
