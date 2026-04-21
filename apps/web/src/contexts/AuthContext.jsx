import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(pb.authStore.model);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentUser(pb.authStore.model);
    setLoading(false);

    const unsubscribe = pb.authStore.onChange((token, model) => {
      setCurrentUser(model);
    });

    return () => unsubscribe();
  }, []);

  const loginBrandOwner = async (email, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
      
      if (authData.record.role !== 'brand_owner') {
        pb.authStore.clear();
        throw new Error("Unauthorized: This account is not a brand owner.");
      }
      
      if (!authData.record.approved) {
        pb.authStore.clear();
        throw new Error("Account pending: Your brand owner account has not been approved by an admin yet.");
      }

      setCurrentUser(authData.record);
      return authData;
    } catch (error) {
      console.error("Brand owner login error:", error);
      throw error;
    }
  };

  const loginAdmin = async (email, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
      if (authData.record.role !== 'super_admin') {
        pb.authStore.clear();
        throw new Error("Unauthorized: This account does not have admin privileges.");
      }
      setCurrentUser(authData.record);
      return authData;
    } catch (error) {
      console.error("Admin login error:", error);
      throw error;
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
    toast.success("Logged out successfully");
  };

  const signup = async (data) => {
    try {
      const user = await pb.collection('users').create({
        email: data.email,
        password: data.password,
        passwordConfirm: data.password,
        name: data.fullName,
        role: 'brand_owner',
        approved: false
      }, { $autoCancel: false });

      await pb.collection('brand_owners').create({
        userId: user.id,
        fullName: data.fullName,
        brandName: data.brandName,
        mobile: data.mobile,
        email: data.email,
        address: data.address || '',
        status: 'pending',
        approved: false
      }, { $autoCancel: false });

      return user;
    } catch (error) {
      const msg = error.message?.toLowerCase() || '';
      const emailErrorMsg = error.response?.data?.email?.message?.toLowerCase() || '';

      if (msg.includes('unique') || msg.includes('duplicate') || emailErrorMsg.includes('unique') || emailErrorMsg.includes('duplicate')) {
        throw new Error('This email is already registered. Please use a different email or try logging in.');
      }
      throw new Error(error.response?.message || "Failed to register. Please try again.");
    }
  };

  const value = {
    currentUser,
    loading,
    loginBrandOwner,
    loginAdmin,
    logout,
    signup,
    isAuthenticated: pb.authStore.isValid,
    isAdmin: currentUser?.role === 'super_admin',
    isBrandOwner: currentUser?.role === 'brand_owner',
    isApproved: currentUser?.approved === true
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
