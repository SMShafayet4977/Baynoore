export default function LoadingSpinner({ size = "md", className = "" }) {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} border-2 border-beige border-t-gold-muted rounded-full animate-spin`}
      />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-beige border-t-gold-muted rounded-full animate-spin mx-auto mb-4" />
        <p className="text-brown-light text-sm font-sans">Loading...</p>
      </div>
    </div>
  );
}
