import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import adminApi from "../../services/api";

const AdminOTPVerification = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { email, type } = location.state || {};

  useEffect(() => {
    if (!email || !type) {
      toast.error("Invalid access. Please start over.");
      navigate("/admin-forgot-password");
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, type, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      return toast.error("Please enter a valid 6-digit code");
    }

    setLoading(true);
    try {
      const res = await adminApi.auth.verifyAdminOTP({ 
        email, 
        otp,
        type 
      });

      if (res.data.success) {
        toast.success("Code verified successfully");
        // Navigate to reset password page
        navigate("/admin-reset-password", { 
          state: { 
            email: email,
            token: res.data.token
          } 
        });
      } else {
        toast.error(res.data.error || "Invalid verification code");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setResendLoading(true);
    try {
      const res = await adminApi.auth.sendAdminOTP({ email });

      if (res.data.success) {
        toast.success("New verification code sent");
        setCountdown(60);
        setCanResend(false);
        
        // Restart countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              setCanResend(true);
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(res.data.error || "Failed to resend code");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
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
            Verify Your Email
          </h2>
          <p className="text-gray-600 mt-2">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-gray-800 font-medium">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              value={otp}
              onChange={handleOtpChange}
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
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
                Verifying...
              </div>
            ) : (
              "Verify Code"
            )}
          </button>
        </form>

        <div className="text-center mt-6 space-y-4">
          <div>
            {canResend ? (
              <button
                onClick={handleResendOTP}
                disabled={resendLoading}
                className="text-red-500 font-semibold hover:underline disabled:opacity-50"
              >
                {resendLoading ? "Sending..." : "Resend Code"}
              </button>
            ) : (
              <p className="text-gray-600">
                Resend code in {countdown} seconds
              </p>
            )}
          </div>
          
          <div>
            <span className="text-gray-700">Wrong email?</span>{" "}
            <button
              onClick={() => navigate("/admin-forgot-password")}
              className="text-red-500 font-semibold hover:underline"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOTPVerification;
