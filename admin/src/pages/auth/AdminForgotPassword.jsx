import { useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import adminApi from "../../services/api";

const AdminForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Email is required");

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return toast.error("Please enter a valid email address");
    }

    setLoading(true);
    try {
      // API call to send OTP to admin email
      const res = await adminApi.auth.sendAdminOTP({ email });

      if (res.data.success) {
        toast.success("Verification code sent to your email");
        // Navigate to OTP verification page with email
        navigate("/admin-verify-otp", { 
          state: { 
            email: email,
            type: 'forgot-password'
          } 
        });
      } else {
        toast.error(res.data.error || "Failed to send verification code");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <img
            src="/images/logo.png"
            alt="logo"
            className="h-16 mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-red-600">
            Admin Forgot Password
          </h2>
          <p className="text-gray-600 mt-2">
            Enter your admin email to receive a verification code
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Email Address
            </label>
            <input
              type="email"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter your admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 text-white p-3 rounded-md hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending Code...
              </div>
            ) : (
              "Send Verification Code"
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <span className="text-gray-700">Remembered your password?</span>{" "}
          <Link
            to="/login"
            className="text-red-500 font-semibold hover:underline"
          >
            Back to Login →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
