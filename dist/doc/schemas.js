import { z } from 'zod';
// User schemas
export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    username: z.string().min(3).max(30).optional(),
    full_name: z.string().min(1).max(100).optional(),
    avatar_url: z.string().url().optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    last_login: z.string().datetime().optional(),
    is_active: z.boolean().default(true),
});
export const CreateUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
    username: z.string().min(3).max(30),
    full_name: z.string().min(1).max(100),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
    terms_accepted: z.boolean(),
    privacy_policy_accepted: z.boolean(),
});
export const UpdateUserSchema = z.object({
    username: z.string().min(3).max(30),
    full_name: z.string().min(1).max(100),
    avatar_url: z.string().url().optional().nullable(),
    bio: z.string().max(500).optional(),
    fitness_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    date_of_birth: z.string(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
    height: z.number().min(50).max(300),
    weight: z.number().min(20).max(500),
    timezone: z.string().optional(),
    language: z.string().min(2).max(5).optional(),
});
// Auth schemas
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
export const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
    username: z.string().min(3).max(30),
    full_name: z.string().min(1).max(100),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
    terms_accepted: z.boolean().refine(val => val === true, { message: 'Terms must be accepted' }),
    privacy_policy_accepted: z.boolean().refine(val => val === true, { message: 'Privacy policy must be accepted' }),
    bio: z.string().max(500).optional(),
    avatar_url: z.string().url().optional(),
    fitness_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    timezone: z.string().optional(),
    language: z.string().min(2).max(5).optional(),
});
export const PasswordResetRequestSchema = z.object({
    email: z.string().email(),
});
export const PasswordResetConfirmSchema = z.object({
    token: z.string().min(1),
    new_password: z.string().min(8).max(100),
});
// Workout schemas
export const WorkoutSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    duration_minutes: z.number().int().min(1).max(300).optional(),
    difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
    muscle_groups: z.array(z.string()).min(1),
    equipment_needed: z.array(z.string()).default([]),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
export const CreateWorkoutSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    duration_minutes: z.number().int().min(1).max(300).optional(),
    difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
    muscle_groups: z.array(z.string()).min(1),
    equipment_needed: z.array(z.string()).default([]),
});
export const UpdateWorkoutSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    duration_minutes: z.number().int().min(1).max(300).optional(),
    difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    muscle_groups: z.array(z.string()).min(1).optional(),
    equipment_needed: z.array(z.string()).optional(),
});
// Exercise schemas
export const ExerciseSchema = z.object({
    id: z.string().uuid(),
    workout_id: z.string().uuid(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    sets: z.number().int().min(1).max(50).optional(),
    reps: z.number().int().min(1).max(1000).optional(),
    weight: z.number().min(0).max(1000).optional(),
    duration_seconds: z.number().int().min(1).max(3600).optional(),
    rest_seconds: z.number().int().min(0).max(600).optional(),
    order_index: z.number().int().min(0),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
export const CreateExerciseSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    sets: z.number().int().min(1).max(50).optional(),
    reps: z.number().int().min(1).max(1000).optional(),
    weight: z.number().min(0).max(1000).optional(),
    duration_seconds: z.number().int().min(1).max(3600).optional(),
    rest_seconds: z.number().int().min(0).max(600).optional(),
    order_index: z.number().int().min(0),
});
export const UpdateExerciseSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    sets: z.number().int().min(1).max(50).optional(),
    reps: z.number().int().min(1).max(1000).optional(),
    weight: z.number().min(0).max(1000).optional(),
    duration_seconds: z.number().int().min(1).max(3600).optional(),
    rest_seconds: z.number().int().min(0).max(600).optional(),
    order_index: z.number().int().min(0).optional(),
});
// Workout Session schemas
export const WorkoutSessionSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    workout_id: z.string().uuid(),
    started_at: z.string().datetime(),
    completed_at: z.string().datetime().optional(),
    duration_minutes: z.number().int().min(0).max(300).optional(),
    notes: z.string().max(1000).optional(),
    exercises_completed: z.number().int().min(0),
    total_exercises: z.number().int().min(0),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
export const CreateWorkoutSessionSchema = z.object({
    workout_id: z.string().uuid(),
    notes: z.string().max(1000).optional(),
});
export const UpdateWorkoutSessionSchema = z.object({
    completed_at: z.string().datetime().optional(),
    duration_minutes: z.number().int().min(0).max(300).optional(),
    notes: z.string().max(1000).optional(),
    exercises_completed: z.number().int().min(0).optional(),
});
// Social Post schemas
export const SocialPostSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    content: z.string().min(1).max(2000),
    workout_id: z.string().uuid().nullable().optional(),
    image_urls: z.array(z.string().url()).default([]),
    video_url: z.string().url().nullable().optional(),
    hashtags: z.array(z.string()).default([]),
    likes_count: z.number().int().min(0).default(0),
    comments_count: z.number().int().min(0).default(0),
    shares_count: z.number().int().min(0).default(0),
    reposts_count: z.number().int().min(0).default(0),
    is_public: z.boolean().default(true),
    is_original: z.boolean().default(true),
    original_post_id: z.string().uuid().nullable().optional(),
    shared_from_user_id: z.string().uuid().nullable().optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
export const CreateSocialPostSchema = z.object({
    content: z.string().min(1).max(2000),
    workout_id: z.string().uuid().nullable().optional(),
    image_urls: z.array(z.string().url()).default([]),
    video_url: z.string().url().nullable().optional(),
    hashtags: z.array(z.string().regex(/^#[a-zA-Z0-9_]+$/)).default([]),
    is_public: z.boolean().default(true),
    is_original: z.boolean().default(true),
    original_post_id: z.string().uuid().nullable().optional(),
    shared_from_user_id: z.string().uuid().nullable().optional(),
});
export const UpdateSocialPostSchema = z.object({
    content: z.string().min(1).max(2000).optional(),
    workout_id: z.string().uuid().nullable().optional(),
    image_urls: z.array(z.string().url()).optional(),
    video_url: z.string().url().nullable().optional(),
    hashtags: z.array(z.string().regex(/^#[a-zA-Z0-9_]+$/)).optional(),
    is_public: z.boolean().optional(),
    is_original: z.boolean().optional(),
});
// Comment schemas
export const CommentSchema = z.object({
    id: z.string().uuid(),
    post_id: z.string().uuid(),
    user_id: z.string().uuid(),
    content: z.string().min(1).max(500),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
export const CreateCommentSchema = z.object({
    post_id: z.string().uuid(),
    content: z.string().min(1).max(500),
});
export const UpdateCommentSchema = z.object({
    content: z.string().min(1).max(500),
});
// Personal Info schemas
export const PersonalInfoSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    age: z.number().int().min(13).max(120).optional(),
    height_cm: z.number().min(50).max(300).optional(),
    weight_kg: z.number().min(20).max(500).optional(),
    fitness_goal: z.enum(['weight_loss', 'muscle_gain', 'endurance', 'strength', 'general_fitness']).optional(),
    activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
    medical_conditions: z.array(z.string()).default([]),
    dietary_preferences: z.array(z.string()).default([]),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
export const CreatePersonalInfoSchema = z.object({
    age: z.number().int().min(13).max(120).optional(),
    height_cm: z.number().min(50).max(300).optional(),
    weight_kg: z.number().min(20).max(500).optional(),
    fitness_goal: z.enum(['weight_loss', 'muscle_gain', 'endurance', 'strength', 'general_fitness']).optional(),
    activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
    medical_conditions: z.array(z.string()).default([]),
    dietary_preferences: z.array(z.string()).default([]),
});
export const UpdatePersonalInfoSchema = z.object({
    age: z.number().int().min(13).max(120).optional(),
    height_cm: z.number().min(50).max(300).optional(),
    weight_kg: z.number().min(20).max(500).optional(),
    fitness_goal: z.enum(['weight_loss', 'muscle_gain', 'endurance', 'strength', 'general_fitness']).optional(),
    activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
    medical_conditions: z.array(z.string()).optional(),
    dietary_preferences: z.array(z.string()).optional(),
});
// Pagination schemas
export const PaginationSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
});
// Query schemas
export const WorkoutQuerySchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
    difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    muscle_groups: z.string().optional(),
    search: z.string().optional(),
});
export const SocialPostQuerySchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
    user_id: z.string().uuid().optional(),
    is_public: z.boolean().optional(),
    search: z.string().optional(),
});
// Response schemas
export const ApiResponseSchema = z.object({
    success: z.boolean(),
    data: z.any().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
    timestamp: z.string().datetime(),
});
export const PaginatedResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(z.any()),
    pagination: z.object({
        page: z.number().int(),
        limit: z.number().int(),
        total: z.number().int(),
        totalPages: z.number().int(),
    }),
    timestamp: z.string().datetime(),
});
// Create additional auth schemas
const RefreshTokenSchema = z.object({
    refreshToken: z.string(),
});
const VerifyEmailSchema = z.object({
    token: z.string(),
});
const ResendVerificationSchema = z.object({
    email: z.string().email(),
});
const ChangePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6),
});
// Export auth schemas as a group
export const AuthSchemas = {
    registerBody: RegisterSchema,
    loginBody: LoginSchema,
    refreshBody: RefreshTokenSchema,
    forgotPasswordBody: PasswordResetRequestSchema,
    resetPasswordBody: PasswordResetConfirmSchema,
    verifyEmailBody: VerifyEmailSchema,
    resendVerificationBody: ResendVerificationSchema,
    changePasswordBody: ChangePasswordSchema,
    passwordResetRequestBody: PasswordResetRequestSchema,
    passwordResetConfirmBody: PasswordResetConfirmSchema,
};
// Create additional user schemas
const GetUserParamsSchema = z.object({
    id: z.string(),
});
const SearchUsersQuerySchema = z.object({
    q: z.string(),
    page: z.string().optional(),
    limit: z.string().optional(),
});
const DeleteAccountBodySchema = z.object({
    confirmation: z.string(),
});
// Export user schemas as a group
export const UserSchemas = {
    UserSchema,
    createUserBody: CreateUserSchema,
    updateUserBody: UpdateUserSchema,
    updateProfileBody: UpdateUserSchema,
    getUserParams: GetUserParamsSchema,
    searchUsersQuery: SearchUsersQuerySchema,
    paginationQuery: PaginationSchema,
    deleteAccountBody: DeleteAccountBodySchema,
};
// Export workout schemas as a group
export const WorkoutSchemas = {
    WorkoutSchema,
    ExerciseSchema,
    WorkoutSessionSchema,
    listWorkoutsQuery: WorkoutQuerySchema,
    createWorkoutBody: CreateWorkoutSchema,
    updateWorkoutBody: UpdateWorkoutSchema,
    getWorkoutParams: z.object({ id: z.string() }),
    addExerciseBody: CreateExerciseSchema,
    updateExerciseBody: UpdateExerciseSchema,
    updateExerciseParams: z.object({ id: z.string(), exerciseId: z.string() }),
    startWorkoutBody: CreateWorkoutSessionSchema,
    completeWorkoutBody: UpdateWorkoutSessionSchema,
    listSessionsQuery: PaginationSchema,
    getSessionParams: z.object({ sessionId: z.string() }),
    updateSessionBody: UpdateWorkoutSessionSchema,
};
// Create additional social schemas
const GetPostParamsSchema = z.object({
    id: z.string(),
});
const TrendingPostsQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
});
const SearchPostsQuerySchema = z.object({
    q: z.string(),
    page: z.string().optional(),
    limit: z.string().optional(),
});
const AddCommentBodySchema = z.object({
    content: z.string(),
});
const ListCommentsQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
});
const DeleteCommentParamsSchema = z.object({
    commentId: z.string(),
});
const SharePostBodySchema = z.object({
    message: z.string().optional(),
});
const RepostBodySchema = z.object({
    content: z.string().optional(),
});
const FollowUserParamsSchema = z.object({
    userId: z.string(),
});
const FeedQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
});
// Export social schemas as a group
export const SocialSchemas = {
    SocialPostSchema,
    createPostBody: CreateSocialPostSchema,
    updatePostBody: UpdateSocialPostSchema,
    listPostsQuery: SocialPostQuerySchema,
    getPostParams: GetPostParamsSchema,
    trendingPostsQuery: TrendingPostsQuerySchema,
    searchPostsQuery: SearchPostsQuerySchema,
    addCommentBody: AddCommentBodySchema,
    listCommentsQuery: ListCommentsQuerySchema,
    deleteCommentParams: DeleteCommentParamsSchema,
    sharePostBody: SharePostBodySchema,
    repostBody: RepostBodySchema,
    followUserParams: FollowUserParamsSchema,
    paginationQuery: PaginationSchema,
    feedQuery: FeedQuerySchema,
};
// Create routine-specific schemas
const ListRoutinesQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    difficulty: z.string().optional(),
});
const CreateRoutineBodySchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    difficulty: z.string(),
    duration_weeks: z.number(),
    days_per_week: z.number(),
});
const GetRoutineParamsSchema = z.object({
    id: z.string(),
});
const UpdateRoutineBodySchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    difficulty: z.string().optional(),
});
const ShareRoutineBodySchema = z.object({
    is_public: z.boolean().optional(),
});
const DuplicateRoutineBodySchema = z.object({
    name: z.string().optional(),
});
const AddExerciseToRoutineBodySchema = z.object({
    workout_id: z.string(),
    day_of_week: z.number(),
    order_index: z.number().optional(),
});
const UpdateRoutineExerciseParamsSchema = z.object({
    id: z.string(),
    exerciseId: z.string(),
});
const UpdateRoutineExerciseBodySchema = z.object({
    day_of_week: z.number().optional(),
    order_index: z.number().optional(),
});
const SearchRoutinesQuerySchema = z.object({
    q: z.string(),
    page: z.string().optional(),
    limit: z.string().optional(),
});
const TrendingRoutinesQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
});
// Export routine schemas as a group
export const RoutineSchemas = {
    listRoutinesQuery: ListRoutinesQuerySchema,
    createRoutineBody: CreateRoutineBodySchema,
    getRoutineParams: GetRoutineParamsSchema,
    updateRoutineBody: UpdateRoutineBodySchema,
    shareRoutineBody: ShareRoutineBodySchema,
    duplicateRoutineBody: DuplicateRoutineBodySchema,
    addExerciseToRoutineBody: AddExerciseToRoutineBodySchema,
    updateRoutineExerciseParams: UpdateRoutineExerciseParamsSchema,
    updateRoutineExerciseBody: UpdateRoutineExerciseBodySchema,
    searchRoutinesQuery: SearchRoutinesQuerySchema,
    trendingRoutinesQuery: TrendingRoutinesQuerySchema,
};
// Create dashboard-specific schemas
const StatsQuerySchema = z.object({
    period: z.string().optional(),
});
const RecentActivityQuerySchema = z.object({
    limit: z.string().optional(),
    offset: z.string().optional(),
});
const WorkoutProgressQuerySchema = z.object({
    period: z.string().optional(),
});
const AchievementsQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
});
const CreateGoalBodySchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    target_value: z.number(),
    current_value: z.number().optional(),
    deadline: z.string().optional(),
});
const GoalParamsSchema = z.object({
    id: z.string(),
});
const UpdateGoalBodySchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    target_value: z.number().optional(),
    current_value: z.number().optional(),
    status: z.string().optional(),
});
const AnalyticsQuerySchema = z.object({
    period: z.string().optional(),
});
const NotificationsQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    type: z.string().optional(),
});
const NotificationParamsSchema = z.object({
    id: z.string(),
});
const LeaderboardQuerySchema = z.object({
    type: z.string().optional(),
    limit: z.string().optional(),
});
const CalendarQuerySchema = z.object({
    month: z.string(),
    year: z.string(),
});
// Export dashboard schemas as a group
export const DashboardSchemas = {
    statsQuery: StatsQuerySchema,
    recentActivityQuery: RecentActivityQuerySchema,
    workoutProgressQuery: WorkoutProgressQuerySchema,
    achievementsQuery: AchievementsQuerySchema,
    createGoalBody: CreateGoalBodySchema,
    goalParams: GoalParamsSchema,
    updateGoalBody: UpdateGoalBodySchema,
    analyticsQuery: AnalyticsQuerySchema,
    notificationsQuery: NotificationsQuerySchema,
    notificationParams: NotificationParamsSchema,
    leaderboardQuery: LeaderboardQuerySchema,
    calendarQuery: CalendarQuerySchema,
};
// Create settings-specific schemas
const UpdateSettingsBodySchema = z.object({
    theme: z.string().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    notifications: z.object({}).passthrough().optional(),
    privacy: z.object({}).passthrough().optional(),
});
const UpdateNotificationSettingsBodySchema = z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
});
const UpdatePrivacySettingsBodySchema = z.object({
    profile_public: z.boolean().optional(),
    workouts_public: z.boolean().optional(),
    posts_public: z.boolean().optional(),
});
const UpdateUserPreferencesBodySchema = z.object({
    theme: z.string().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    units: z.object({}).passthrough().optional(),
});
const UpdateFitnessSettingsBodySchema = z.object({
    fitness_level: z.string().optional(),
    goals: z.array(z.string()).optional(),
    units: z.object({}).passthrough().optional(),
});
const UpdateSocialSettingsBodySchema = z.object({
    profile_public: z.boolean().optional(),
    workouts_public: z.boolean().optional(),
});
const ExportUserDataBodySchema = z.object({
    format: z.string().optional(),
});
const ImportUserDataBodySchema = z.object({
    data: z.object({}).passthrough(),
});
const DeleteUserAccountBodySchema = z.object({
    confirmation: z.string(),
});
const ActivityLogQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
});
const ChangeEmailBodySchema = z.object({
    new_email: z.string().email(),
    password: z.string(),
});
const VerifyEmailChangeBodySchema = z.object({
    token: z.string(),
});
// Export settings schemas as a group
export const SettingsSchemas = {
    updateSettingsBody: UpdateSettingsBodySchema,
    updateNotificationSettingsBody: UpdateNotificationSettingsBodySchema,
    updatePrivacySettingsBody: UpdatePrivacySettingsBodySchema,
    updateUserPreferencesBody: UpdateUserPreferencesBodySchema,
    updateFitnessSettingsBody: UpdateFitnessSettingsBodySchema,
    updateSocialSettingsBody: UpdateSocialSettingsBodySchema,
    exportUserDataBody: ExportUserDataBodySchema,
    importUserDataBody: ImportUserDataBodySchema,
    deleteUserAccountBody: DeleteUserAccountBodySchema,
    activityLogQuery: ActivityLogQuerySchema,
    changeEmailBody: ChangeEmailBodySchema,
    verifyEmailChangeBody: VerifyEmailChangeBodySchema,
};
// Individual auth schemas for backward compatibility
export const registerSchema = AuthSchemas.registerBody;
export const loginSchema = AuthSchemas.loginBody;
export const resetPasswordRequestSchema = AuthSchemas.forgotPasswordBody;
export const resetPasswordSchema = AuthSchemas.resetPasswordBody;
export const changePasswordSchema = AuthSchemas.changePasswordBody;
export const updateProfileSchema = UserSchemas.updateProfileBody;
