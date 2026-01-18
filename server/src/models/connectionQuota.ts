export interface ConnectionQuota {
  _id: string;                    // Same as userId for easy lookup

  // Daily limits
  dailyCount: number;             // Requests sent today
  dailyResetDate: string;         // "YYYY-MM-DD" format
  dailyLimit: number | null;      // null = no daily limit (e.g., purchased credits)

  // Total credits
  totalAvailable: number;         // Total credits user has
  totalUsed: number;              // Total credits used

  createdAt: Date;
  updatedAt: Date;
}

export interface QuotaStatus {
  dailyRemaining: number;
  dailyLimit: number | null;
  totalRemaining: number;
  totalAvailable: number;
}

// Default values for new users
export const DEFAULT_DAILY_LIMIT = 2;
export const DEFAULT_TOTAL_CREDITS = 20;
