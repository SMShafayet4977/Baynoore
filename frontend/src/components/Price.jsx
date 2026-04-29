import { formatPrice } from "../utils/formatPrice";

export default function Price({ regular, sale, size = "md" }) {
  const sizes = {
    sm: { sale: "text-sm font-semibold", regular: "text-xs" },
    md: { sale: "text-base font-semibold", regular: "text-sm" },
    lg: { sale: "text-xl font-bold", regular: "text-base" },
    xl: { sale: "text-2xl font-bold", regular: "text-lg" },
  };
  const s = sizes[size] || sizes.md;

  if (sale && Number(sale) < Number(regular)) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`${s.sale} text-brown-dark`}>{formatPrice(sale)}</span>
        <span className={`${s.regular} text-brown-light line-through`}>
          {formatPrice(regular)}
        </span>
      </div>
    );
  }
  return <span className={`${s.sale} text-brown-dark`}>{formatPrice(regular)}</span>;
}
