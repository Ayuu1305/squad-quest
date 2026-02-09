import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Store,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Lock,
  Image as ImageIcon,
  ArrowRight,
  Upload,
  Star, // ✅ For rating display
} from "lucide-react";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth"; // For secondary auth
import { initializeApp, getApp, deleteApp } from "firebase/app"; // For secondary instance
import { auth, db } from "../../backend/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { createVendorAccount } from "../../backend/services/vendor.service";
import toast from "react-hot-toast";

const HubSignup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    // Hub Details
    hubName: "",
    category: "Café",
    address: "",
    city: "",
    latitude: "",
    longitude: "",
    rating: "5.0", // ✅ Default rating

    // Vendor/Owner Details
    ownerName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const categories = ["Café", "Sports", "Gaming", "Education"];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!imageFile) {
      toast.error("Please upload a hub image");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Creating your hub account...");

    try {
      // Step 1: Create Firebase Auth account using SECONDARY instance
      // ✅ FIX: Use secondary auth to avoid logging out the current admin
      const secondaryApp = initializeApp(
        getApp().options,
        "Secondary" + Date.now(),
      );
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email,
        formData.password,
      );
      const user = userCredential.user;

      // Delete secondary app to clean up
      await deleteApp(secondaryApp);

      // Step 2: Upload hub image to Cloudinary
      const imageUrl = await uploadToCloudinary(imageFile);

      // Step 3: Create hub document in Firestore
      const hubId = `hub_${user.uid}`;
      await setDoc(doc(db, "hubs", hubId), {
        name: formData.hubName,
        category: formData.category,
        address: formData.address,
        city: formData.city,
        coordinates: {
          latitude: parseFloat(formData.latitude) || 0,
          longitude: parseFloat(formData.longitude) || 0,
        },
        image: imageUrl,
        rating: parseFloat(formData.rating) || 0, // ✅ Use form rating
        tags: [formData.category.toLowerCase()],
        secretCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        createdAt: serverTimestamp(),
        isVerified: false, // Will be verified by admin
      });

      // Step 4: Create vendor profile
      await createVendorAccount({
        uid: user.uid,
        email: formData.email,
        hubId: hubId,
        hubName: formData.hubName,
        hubAddress: formData.address,
        category: formData.category,
        city: formData.city,
        ownerName: formData.ownerName,
        phoneNumber: formData.phoneNumber,
      });

      toast.success("Hub registered successfully! 🎉", { id: toastId });

      // ✅ ADMIN FLOW: Redirect back to hub management dashboard
      setTimeout(() => {
        navigate("/admin/manage-hubs");
      }, 1000);
    } catch (error) {
      console.error("Signup error:", error);

      switch (error.code) {
        case "auth/email-already-in-use":
          toast.error("This email is already registered", { id: toastId });
          break;
        case "auth/invalid-email":
          toast.error("Invalid email format", { id: toastId });
          break;
        case "auth/weak-password":
          toast.error("Password is too weak", { id: toastId });
          break;
        default:
          toast.error("Registration failed. Please try again.", {
            id: toastId,
          });
      }
    } finally {
      setLoading(false);
    }
  };

  // Cloudinary upload function (same as VerificationEngine)
  const uploadToCloudinary = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Image = event.target.result;

          const formDataCloud = new FormData();
          formDataCloud.append("file", base64Image);
          formDataCloud.append("upload_preset", "users_profiles");
          formDataCloud.append("cloud_name", "dxmsic7rl");

          const response = await fetch(
            "https://api.cloudinary.com/v1_1/dxmsic7rl/image/upload",
            {
              method: "POST",
              body: formDataCloud,
            },
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || "Image upload failed");
          }

          const data = await response.json();
          resolve(data.secure_url);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#0f0f23] py-12 px-6">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-neon-purple/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-neon-purple to-blue-600 rounded-2xl mb-4 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-['Orbitron'] font-black text-white uppercase tracking-tight mb-2">
            Register Your Hub
          </h1>
          <p className="text-sm text-gray-400">
            Join Squad Quest as a venue partner
          </p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section: Hub Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-neon-purple" />
                Hub Information
              </h2>

              {/* Hub Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                  Hub Name *
                </label>
                <input
                  type="text"
                  value={formData.hubName}
                  onChange={(e) =>
                    setFormData({ ...formData, hubName: e.target.value })
                  }
                  placeholder="Tero Cafe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-purple focus:outline-none transition-all"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#1a1a2e]">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Sindhu Bhavan Road, Ahmedabad"
                  rows="2"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-all resize-none"
                  required
                />
              </div>

              {/* City & Coordinates */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Ahmedabad"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    placeholder="23.0225"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    placeholder="72.5714"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* ✨ NEW: Hub Rating */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  Hub Rating *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({ ...formData, rating: e.target.value })
                  }
                  placeholder="5.0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-all"
                  required
                />
                <p className="text-[10px] text-gray-500">
                  Set your hub's rating (0-5 stars). This will be displayed to
                  users.
                </p>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-3 h-3" />
                  Hub Image *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="hub-image"
                    required
                  />
                  <label
                    htmlFor="hub-image"
                    className="flex items-center justify-center gap-2 w-full bg-white/5 border-2 border-dashed border-white/10 rounded-xl px-4 py-6 text-gray-400 hover:border-neon-purple hover:text-white transition-all cursor-pointer"
                  >
                    {imagePreview ? (
                      <div className="relative w-full h-40">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span className="text-sm">Click to upload image</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Section: Owner Details */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-neon-purple" />
                Owner Information
              </h2>

              {/* Owner Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                  Owner Name *
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerName: e.target.value })
                  }
                  placeholder="Raj Patel"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="owner@terocafe.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder="+91-9876543210"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-neon-purple to-blue-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider mt-8"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Register Hub
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-500">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/vendor/login")}
                className="text-neon-purple hover:underline font-bold"
              >
                Login Here
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HubSignup;
