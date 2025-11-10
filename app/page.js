"use client";
import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [user, setUser] = React.useState({
    email: "",
    password: "",
  });

  const onLogin = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.post("/api/login", user);
      console.log(response.data);
      router.push("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") onLogin();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-white">
      <div className="w-full max-w-md p-8 bg-black text-white rounded-lg border-2 border-white">
        <h1 className="text-2xl font-bold text-center mb-2">
          {loading ? "Processing..." : "Login"}
        </h1>
        <p className="text-gray-300 text-center mb-6">
          Enter your credentials to access your account
        </p>

        {error && (
          <div className="mb-4 p-3 bg-white text-black border-2 border-black rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              onKeyPress={handleKeyPress}
              placeholder="Enter your email"
              disabled={loading}
              className="w-full px-3 py-2 bg-white text-black border rounded-md focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              onKeyPress={handleKeyPress}
              placeholder="Enter your password"
              disabled={loading}
              className="w-full px-3 py-2 bg-white text-black border rounded-md focus:outline-none"
            />
          </div>

          <button
            onClick={onLogin}
            disabled={loading || !user.email || !user.password}
            className="w-full py-2 px-4 bg-white text-black rounded-md hover:bg-gray-200 disabled:bg-gray-400"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

        <p className="text-sm text-gray-300 text-center mt-6">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-white hover:underline font-medium">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}
