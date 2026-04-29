import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { CheckCircle } from "lucide-react";
import { authApi } from "../../services/authApi";
import mainLogo from "../../assets/baynoore-main-logo.png";

export default function AdminSignup() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(data) {
    setError("");
    setLoading(true);
    try {
      await authApi.signup({ name: data.name, email: data.email, password: data.password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={mainLogo} alt="Baynoore" className="h-12 w-auto object-contain mx-auto mb-2" />
          <p className="text-xs tracking-[0.2em] text-gold-muted">MODESTY WITH ELEGANCE</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {success ? (
            <div className="text-center">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="font-serif text-xl text-brown mb-3">Request Submitted</h2>
              <p className="text-sm text-brown-light mb-6">
                Your admin signup request has been submitted. Please wait for super admin approval.
              </p>
              <Link to="/admin/login" className="text-gold-muted text-sm hover:underline">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-xl text-brown mb-6 text-center">Request Admin Access</h1>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-5">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brown mb-1.5">Full Name</label>
                  <input
                    {...register("name", { required: "Name is required" })}
                    className="w-full border border-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-muted"
                    placeholder="Your name"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown mb-1.5">Email</label>
                  <input
                    {...register("email", { required: "Email is required" })}
                    type="email"
                    className="w-full border border-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-muted"
                    placeholder="admin@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown mb-1.5">Password</label>
                  <input
                    {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 characters" } })}
                    type="password"
                    className="w-full border border-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-muted"
                    placeholder="••••••••"
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown mb-1.5">Confirm Password</label>
                  <input
                    {...register("confirm", {
                      required: "Please confirm password",
                      validate: (v) => v === watch("password") || "Passwords do not match",
                    })}
                    type="password"
                    className="w-full border border-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-muted"
                    placeholder="••••••••"
                  />
                  {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brown text-ivory py-3.5 rounded-xl font-medium hover:bg-brown-dark transition-colors disabled:opacity-60 mt-2"
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
              </form>
              <p className="text-center text-xs text-brown-light mt-5">
                Already have access?{" "}
                <Link to="/admin/login" className="text-gold-muted hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
