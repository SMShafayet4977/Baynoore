import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import mainLogo from "../../assets/baynoore-main-logo.png";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(data) {
    setError("");
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={mainLogo} alt="Baynoore - Modesty with Elegance" className="h-12 w-auto object-contain mx-auto mb-2" />
          <p className="text-xs tracking-[0.2em] text-gold-muted">MODESTY WITH ELEGANCE</p>
          <p className="text-sm text-brown-light mt-2">Admin Panel</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="font-serif text-xl text-brown mb-6 text-center">Sign In</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brown mb-1.5">Email</label>
              <input
                {...register("email", { required: "Email is required" })}
                type="email"
                className="w-full border border-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-muted"
                placeholder="admin@baynoore.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-brown mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register("password", { required: "Password is required" })}
                  type={showPass ? "text" : "password"}
                  className="w-full border border-beige rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-gold-muted"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-light hover:text-brown"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brown text-ivory py-3.5 rounded-xl font-medium hover:bg-brown-dark transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-xs text-brown-light mt-5">
            Need admin access?{" "}
            <Link to="/admin/signup" className="text-gold-muted hover:underline">
              Request an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
