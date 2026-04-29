import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import mainLogo from "../assets/baynoore-main-logo.png";

export default function NotFound() {
  return (
    <>
      <SEO title="Page Not Found" />
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <img src={mainLogo} alt="Baynoore" className="h-10 w-auto object-contain mx-auto mb-8" />
          <p className="font-serif text-8xl text-beige font-bold mb-4">404</p>
          <h1 className="font-serif text-2xl text-brown mb-3">Page Not Found</h1>
          <p className="text-brown-light text-sm mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-brown text-ivory px-8 py-4 rounded-full font-medium hover:bg-brown-dark transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
}
