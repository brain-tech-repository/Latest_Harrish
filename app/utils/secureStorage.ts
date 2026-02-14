/**
 * Secure Storage Utility
 * Provides encrypted storage for sensitive data like role_id and userId
 * 
 * IMPORTANT SECURITY NOTE:
 * This provides BASIC client-side protection against casual tampering.
 * It CANNOT prevent a determined attacker from modifying data.
 * ALWAYS validate permissions and user data on the server side.
 * Never trust client-side data for authorization decisions.
 */

// Simple encryption key - in production, this should be more secure
// Note: Client-side encryption has limitations as the key is visible in the code
const ENCRYPTION_KEY = "hariss-secure-key-2026";

/**
 * Simple XOR encryption (basic obfuscation)
 * For production, consider using Web Crypto API for stronger encryption
 */
function simpleEncrypt(text: string, key: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result); // Base64 encode
}

function simpleDecrypt(encoded: string, key: string): string {
  try {
    const text = atob(encoded); // Base64 decode
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  } catch {
    return "";
  }
}

/**
 * Generate a simple checksum for integrity verification
 */
function generateChecksum(value: string, key: string): string {
  const combined = value + key;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Verify data integrity
 */
function verifyIntegrity(value: string, checksum: string, key: string): boolean {
  return generateChecksum(value, key) === checksum;
}

/**
 * Secure storage wrapper
 */
export const secureStorage = {
  /**
   * Set a secure item in localStorage
   */
  setItem(key: string, value: string): void {
    if (typeof window === "undefined") return;
    
    try {
      const encrypted = simpleEncrypt(value, ENCRYPTION_KEY);
      const checksum = generateChecksum(value, ENCRYPTION_KEY);
      const secureData = JSON.stringify({ data: encrypted, checksum });
      localStorage.setItem(`secure_${key}`, secureData);
    } catch (error) {
      console.error("Failed to store secure item:", error);
    }
  },

  /**
   * Get a secure item from localStorage
   * Returns null if data is tampered with
   */
  getItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    
    try {
      const stored = localStorage.getItem(`secure_${key}`);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      const decrypted = simpleDecrypt(parsed.data, ENCRYPTION_KEY);
      
      // Verify integrity
      if (!verifyIntegrity(decrypted, parsed.checksum, ENCRYPTION_KEY)) {
        console.warn(`Data integrity check failed for ${key}. Data may have been tampered with.`);
        // Clear the tampered data
        this.removeItem(key);
        return null;
      }

      return decrypted;
    } catch (error) {
      console.error("Failed to retrieve secure item:", error);
      return null;
    }
  },

  /**
   * Remove a secure item from localStorage
   */
  removeItem(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(`secure_${key}`);
  },

  /**
   * Clear all secure items
   */
  clear(): void {
    if (typeof window === "undefined") return;
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("secure_")) {
        localStorage.removeItem(key);
      }
    });
  },
};

/**
 * Helper functions for specific secure items
 */
export const secureAuth = {
  setRole(roleId: string | number): void {
    secureStorage.setItem("role", String(roleId));
  },

  getRole(): string | null {
    return secureStorage.getItem("role");
  },

  setUserId(userId: string | number): void {
    secureStorage.setItem("userId", String(userId));
  },

  getUserId(): string | null {
    return secureStorage.getItem("userId");
  },

  setCountry(country: string): void {
    secureStorage.setItem("country", country);
  },

  getCountry(): string | null {
    return secureStorage.getItem("country");
  },

  clearAll(): void {
    secureStorage.removeItem("role");
    secureStorage.removeItem("userId");
    secureStorage.removeItem("country");
  },
};
