/**
 * React hook for accessing secure authentication data
 * Provides easy access to encrypted localStorage values
 */

import { useMemo } from "react";
import { secureAuth } from "../utils/secureStorage";

export function useSecureAuth() {
  // Using useMemo to avoid re-creating the object on every render
  // but still allowing reactive updates if needed
  const auth = useMemo(() => ({
    role: secureAuth.getRole(),
    userId: secureAuth.getUserId(),
    country: secureAuth.getCountry(),
  }), []);

  return {
    role: auth.role,
    userId: auth.userId,
    country: auth.country,
    // Helper for currency display
    currency: auth.country || "",
    // Direct access to secureAuth methods if needed
    setRole: secureAuth.setRole.bind(secureAuth),
    setUserId: secureAuth.setUserId.bind(secureAuth),
    setCountry: secureAuth.setCountry.bind(secureAuth),
    clearAll: secureAuth.clearAll.bind(secureAuth),
  };
}
