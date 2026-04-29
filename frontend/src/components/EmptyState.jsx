import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import iconLogo from "../assets/baynoore-icon-logo.png";

export default function EmptyState({
  icon,
  title = "Nothing here yet",
  message = "",
  action,
  actionLabel = "Continue Shopping",
  actionTo = "/",
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="mb-4 opacity-30">
        {icon || <img src={iconLogo} alt="Baynoore" className="w-16 h-16 object-contain mx-auto" />}
      </div>
      <h3 className="font-serif text-xl text-brown mb-2">{title}</h3>
      {message && <p className="text-brown-light text-sm mb-6 max-w-xs">{message}</p>}
      {action ? (
        action
      ) : (
        <Link
          to={actionTo}
          className="inline-flex items-center gap-2 bg-brown text-ivory px-6 py-3 rounded-full text-sm font-medium hover:bg-brown-dark transition-colors"
        >
          <ShoppingBag size={16} />
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
