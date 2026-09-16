"use client";

import Link from "next/link";
import {
  ArrowLeft,
  AtSign,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/services/authApi";

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Basic frontend validation
    if (
      !formData.name ||
      !formData.username ||
      !formData.email ||
      !formData.password
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const data = await registerUser(formData);

      console.log("Registration successful:", data);

      // Registration successful → go to chat
      router.push("/chat");
    } catch (error) {
      console.error("Registration error:", error);

      setError(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <Link href="/" className="auth-back">
        <ArrowLeft size={17} />
        Back
      </Link>

      <div className="auth-container register-container">
        <div className="auth-brand">
          <span className="brand-mark">N</span>
          <span>NEXUS</span>
        </div>

        <div className="auth-heading">
          <h1>Create your account</h1>
          <p>Join Nexus and start connecting.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Full name</label>

            <div className="input-wrapper">
              <User size={18} />

              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Rohan Kumar"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Username</label>

            <div className="input-wrapper">
              <AtSign size={18} />

              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="rohan"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Email</label>

            <div className="input-wrapper">
              <Mail size={18} />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>

            <div className="input-wrapper">
              <Lock size={18} />

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}