export interface DashboardStats {
  total_workouts: number;
  total_exercises: number;
  total_duration: number;
  average_duration: number;
}

export interface RecentActivity {
  type: string;
  description: string;
  created_at: string;
}

