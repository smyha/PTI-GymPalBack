/**
 * Dashboard Module Types
 * Response types use core/types/unified.types.ts for DashboardStats
 * Local types only for module-specific data structures
 */

// Local types for dashboard-specific data
export interface RecentActivity {
  type: string;
  description: string;
  created_at: string;
}

// DashboardStats response type uses Unified.DashboardStats from core/types/unified.types.ts

