import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";

const VendorAuthContext = createContext();

export const useVendorAuth = () => {
  const context = useContext(VendorAuthContext);
  if (!context) {
    throw new Error("useVendorAuth must be used within VendorAuthProvider");
  }
  return context;
};

export const VendorAuthProvider = ({ children }) => {
  const { user } = useAuth();
  const [vendorProfile, setVendorProfile] = useState(null);
  const [isVendor, setIsVendor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendorProfile = async () => {
      if (!user) {
        setVendorProfile(null);
        setIsVendor(false);
        setLoading(false);
        return;
      }

      try {
        // Check if user has vendor profile
        const vendorDoc = await getDoc(doc(db, "vendors", user.uid));

        if (vendorDoc.exists()) {
          const vendorData = vendorDoc.data();
          setVendorProfile({ id: vendorDoc.id, ...vendorData });
          setIsVendor(true);
        } else {
          setVendorProfile(null);
          setIsVendor(false);
        }
      } catch (error) {
        console.error("Error fetching vendor profile:", error);
        setVendorProfile(null);
        setIsVendor(false);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorProfile();
  }, [user]);

  const value = {
    vendorProfile,
    isVendor,
    loading,
  };

  return (
    <VendorAuthContext.Provider value={value}>
      {children}
    </VendorAuthContext.Provider>
  );
};
