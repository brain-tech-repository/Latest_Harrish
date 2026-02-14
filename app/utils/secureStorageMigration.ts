/**
 * Migration utility to convert existing localStorage data to secure storage
 * Run this once when the user logs in or on app initialization
 */

import { secureAuth } from "./secureStorage";

export function migrateToSecureStorage(): void {
  if (typeof window === "undefined") return;

  try {
    // Check if migration is already done
    const migrationDone = localStorage.getItem("secure_migration_done");
    if (migrationDone === "true") {
      return;
    }

    // Migrate role
    const role = localStorage.getItem("role");
    if (role) {
      secureAuth.setRole(role);
      localStorage.removeItem("role");
    }

    // Migrate userId
    const userId = localStorage.getItem("userId");
    if (userId) {
      secureAuth.setUserId(userId);
      localStorage.removeItem("userId");
    }

    // Migrate country
    const country = localStorage.getItem("country");
    if (country) {
      secureAuth.setCountry(country);
      localStorage.removeItem("country");
    }

    // Mark migration as done
    localStorage.setItem("secure_migration_done", "true");
    
  } catch (error) {
    console.error("Failed to migrate to secure storage:", error);
  }
}

/**
 * For logout - clear all secure data
 */
export function clearSecureData(): void {
  secureAuth.clearAll();
  if (typeof window !== "undefined") {
    localStorage.removeItem("secure_migration_done");
  }
}
