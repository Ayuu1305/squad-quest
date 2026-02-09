import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useVendorAuth } from "../context/VendorAuthContext";

const ProtectedVendorRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { isVendor, loading: vendorLoading } = useVendorAuth();

  if (authLoading || vendorLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#0f0f23] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-mono text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/vendor/login" replace />;
  }

  if (!isVendor) {
    return <Navigate to="/vendor/login" replace />;
  }

  return children;
};

export default ProtectedVendorRoute;
