# GymPal Backend API 

## 📋 Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [Authentication](#authentication-1)
  - [User Management](#user-management)
  - [Personal Information](#personal-information)
  - [Workout Management](#workout-management)
  - [Exercise Management](#exercise-management)
  - [Workout Sessions](#workout-sessions)
  - [Custom Routines](#custom-routines)
  - [Social Features](#social-features)
  - [AI Features](#ai-features)
  - [Analytics](#analytics)
  - [Notifications](#notifications)
  - [Settings](#settings)
  - [Dashboard](#dashboard)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Pagination](#pagination)
- [Search](#search)
- [Webhooks](#webhooks)

## Overview

The GymPal Backend API provides a comprehensive set of endpoints for fitness tracking, social features, AI-powered recommendations, and analytics. This API is built with modern technologies including Hono, TypeScript, Supabase, and Zod validation.

### Base URLs
- **Development**: `http://localhost:3000`
- **Production**: `https://api.gympal.app`

### API Version
- **Current Version**: v1
- **Base Path**: `/api/v1`

## Authentication

The API uses JWT-based authentication with refresh tokens for enhanced security.

### Authentication Flow
1. **Register/Login**: Obtain access and refresh tokens
2. **API Requests**: Include access token in Authorization header
3. **Token Refresh**: Use refresh token to get new access token
4. **Logout**: Invalidate tokens

### Headers
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

## API Endpoints

### User Management

#### Update User Profile
**PUT** `/api/v1/users/profile`

Update user profile information including personal details, fitness level, physical measurements, and preferences. Avatar will be automatically generated if not provided or invalid.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{
  "username": "string (required, 3-30 chars)",
  "full_name": "string (required, 1-100 chars)",
  "avatar_url": "string (optional, nullable, will generate default if not provided or invalid)",
  "bio": "string (optional, max 500 chars)",
  "fitness_level": "string (required, enum: beginner|intermediate|advanced|expert)",
  "date_of_birth": "string (required, date format)",
  "gender": "string (required, enum: male|female|other|prefer_not_to_say)",
  "height": "number (required, 50-300 cm)",
  "weight": "number (required, 20-500 kg)",
  "timezone": "string (optional)",
  "language": "string (optional, 2-5 chars)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user-id",
    "username": "johndoe",
    "full_name": "John Doe",
    "avatar_url": "https://ui-avatars.com/api/?name=JD&background=2196f3&color=fff&size=200&bold=true&format=png",
    "bio": "Fitness enthusiast",
    "fitness_level": "intermediate",
    "gender": "male",
    "height": 180,
    "weight": 75,
    "timezone": "UTC",
    "language": "en",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Avatar Generation:**
- If no `avatar_url` provided or invalid → Generates personalized avatar with user initials
- Color based on gender: Blue (male), Pink (female), Green (other/unknown)
- Uses UI Avatars service for consistent, professional avatars

### Health Check

#### GET /health
Check API health status and database connectivity.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "responseTime": "15ms"
  },
  "services": {
    "supabase": "connected",
    "email": "connected",
    "ai": "connected"
  }
}
```

### Authentication

#### POST /api/v1/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "johndoe",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "johndoe",
      "full_name": "John Doe",
      "created_at": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600,
      "token_type": "Bearer"
    }
  }
}
```

#### POST /api/v1/auth/login
Authenticate a user and return tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "johndoe",
      "full_name": "John Doe"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600,
      "token_type": "Bearer"
    }
  }
}
```

#### POST /api/v1/auth/logout
Logout a user and invalidate tokens.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST /api/v1/auth/refresh
Refresh an access token using a refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "token_type": "Bearer"
  }
}
```

### User Management

#### GET /api/v1/users/profile
Get the current user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "Fitness enthusiast",
    "fitness_level": "intermediate",
    "is_verified": false,
    "created_at": "2024-01-15T10:30:00Z",
    "last_login": "2024-01-15T10:30:00Z",
    "is_active": true
  }
}
```

#### PUT /api/v1/users/profile
Update the current user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "newusername",
  "full_name": "John Smith",
  "bio": "Updated bio",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "newusername",
    "full_name": "John Smith",
    "bio": "Updated bio",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

#### GET /api/v1/users/:id
Get a specific user's public profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "Fitness enthusiast",
    "fitness_level": "intermediate",
    "is_verified": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Personal Information

#### GET /api/v1/users/personal/info
Get user's personal information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "c50e8400-e29b-41d4-a716-446655440000",
    "age": 28,
    "height_cm": 180,
    "weight_kg": 75.5,
    "gender": "male",
    "birth_date": "1995-01-01",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "USA"
    },
    "emergency_contact": {
      "name": "Jane Doe",
      "phone": "+1234567891",
      "relationship": "spouse"
    },
    "medical_conditions": [],
    "allergies": [],
    "medications": []
  }
}
```

#### PUT /api/v1/users/personal/info
Update user's personal information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "age": 29,
  "height_cm": 180,
  "weight_kg": 76.0,
  "gender": "male",
  "birth_date": "1995-01-01",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "emergency_contact": {
    "name": "Jane Doe",
    "phone": "+1234567891",
    "relationship": "spouse"
  }
}
```

#### GET /api/v1/users/personal/objectives
Get user's fitness objectives.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "d50e8400-e29b-41d4-a716-446655440000",
    "fitness_goal": "muscle_gain",
    "target_weight": 80.0,
    "target_body_fat": 15.0,
    "target_muscle_mass": 65.0,
    "target_date": "2024-06-01",
    "activity_level": "active",
    "workout_frequency": 4,
    "workout_duration": 60,
    "preferred_workout_times": ["morning", "evening"],
    "equipment_available": ["dumbbells", "barbell", "bench"],
    "injuries": [],
    "limitations": []
  }
}
```

#### PUT /api/v1/users/personal/objectives
Update user's fitness objectives.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "fitness_goal": "strength",
  "target_weight": 85.0,
  "target_body_fat": 12.0,
  "target_muscle_mass": 70.0,
  "target_date": "2024-08-01",
  "activity_level": "very_active",
  "workout_frequency": 5,
  "workout_duration": 75,
  "preferred_workout_times": ["morning"],
  "equipment_available": ["dumbbells", "barbell", "bench", "squat_rack"]
}
```

#### GET /api/v1/users/personal/dietary-preferences
Get user's dietary preferences.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "e50e8400-e29b-41d4-a716-446655440000",
    "diet_type": "balanced",
    "dietary_restrictions": ["lactose_intolerant"],
    "allergies": ["nuts"],
    "preferred_cuisines": ["mediterranean", "asian"],
    "meal_preferences": {
      "breakfast": "high_protein",
      "lunch": "balanced",
      "dinner": "light",
      "snacks": "healthy"
    },
    "calorie_goal": 2500,
    "protein_goal": 150,
    "carb_goal": 300,
    "fat_goal": 80,
    "water_goal": 3.0,
    "supplements": ["protein_powder", "creatine", "multivitamin"]
  }
}
```

#### PUT /api/v1/users/personal/dietary-preferences
Update user's dietary preferences.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "diet_type": "keto",
  "dietary_restrictions": ["lactose_intolerant", "gluten_free"],
  "allergies": ["nuts", "shellfish"],
  "preferred_cuisines": ["mediterranean"],
  "meal_preferences": {
    "breakfast": "high_fat",
    "lunch": "high_protein",
    "dinner": "low_carb",
    "snacks": "keto_friendly"
  },
  "calorie_goal": 2000,
  "protein_goal": 120,
  "carb_goal": 50,
  "fat_goal": 150,
  "water_goal": 3.5,
  "supplements": ["protein_powder", "creatine", "multivitamin", "omega3"]
}
```

### Workout Management

#### GET /api/v1/workouts
Get user's workouts with pagination and filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `difficulty_level` (optional): Filter by difficulty
- `muscle_groups` (optional): Filter by muscle groups
- `search` (optional): Search in workout names
- `type` (optional): Workout type filter
- `target_goal` (optional): Target goal filter

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440000",
      "name": "Upper Body Strength",
      "description": "Complete upper body workout",
      "duration_minutes": 45,
      "difficulty_level": "intermediate",
      "muscle_groups": ["chest", "back", "shoulders"],
      "equipment_needed": ["barbell", "dumbbells"],
      "type": "strength",
      "target_goal": "muscle_gain",
      "calories_burned": 300,
      "is_public": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### POST /api/v1/workouts
Create a new workout.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Leg Day",
  "description": "Intense leg workout",
  "duration_minutes": 60,
  "difficulty_level": "advanced",
  "muscle_groups": ["legs", "glutes"],
  "equipment_needed": ["barbell", "squat_rack"],
  "type": "strength",
  "target_goal": "muscle_gain",
  "calories_burned": 400,
  "is_public": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "name": "Leg Day",
    "description": "Intense leg workout",
    "duration_minutes": 60,
    "difficulty_level": "advanced",
    "muscle_groups": ["legs", "glutes"],
    "equipment_needed": ["barbell", "squat_rack"],
    "type": "strength",
    "target_goal": "muscle_gain",
    "calories_burned": 400,
    "is_public": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### GET /api/v1/workouts/:id
Get specific workout with exercises.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "650e8400-e29b-41d4-a716-446655440000",
    "name": "Upper Body Strength",
    "description": "Complete upper body workout",
    "duration_minutes": 45,
    "difficulty_level": "intermediate",
    "muscle_groups": ["chest", "back", "shoulders"],
    "equipment_needed": ["barbell", "dumbbells"],
    "type": "strength",
    "target_goal": "muscle_gain",
    "calories_burned": 300,
    "is_public": false,
    "exercises": [
      {
        "id": "750e8400-e29b-41d4-a716-446655440000",
        "name": "Bench Press",
        "description": "Flat bench press with barbell",
        "sets": 4,
        "reps": 8,
        "weight": 80.0,
        "rest_seconds": 120,
        "order_index": 1
      }
    ],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### PUT /api/v1/workouts/:id
Update a specific workout.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Workout Name",
  "description": "Updated description",
  "duration_minutes": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "650e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Workout Name",
    "description": "Updated description",
    "duration_minutes": 50,
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

#### DELETE /api/v1/workouts/:id
Delete a specific workout.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Workout deleted successfully"
}
```

### Exercise Management

#### GET /api/v1/workouts/:workout_id/exercises
Get exercises for a specific workout.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "750e8400-e29b-41d4-a716-446655440000",
      "name": "Bench Press",
      "description": "Flat bench press with barbell",
      "sets": 4,
      "reps": 8,
      "weight": 80.0,
      "rest_seconds": 120,
      "order_index": 1,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### POST /api/v1/workouts/:workout_id/exercises
Add exercise to workout.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Pull-ups",
  "description": "Wide grip pull-ups",
  "sets": 3,
  "reps": 10,
  "weight": 0,
  "rest_seconds": 90,
  "order_index": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "750e8400-e29b-41d4-a716-446655440001",
    "name": "Pull-ups",
    "description": "Wide grip pull-ups",
    "sets": 3,
    "reps": 10,
    "weight": 0,
    "rest_seconds": 90,
    "order_index": 2,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### PUT /api/v1/workouts/:workout_id/exercises/:exercise_id
Update an exercise in a workout.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "sets": 5,
  "reps": 12,
  "weight": 85.0,
  "rest_seconds": 90
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "750e8400-e29b-41d4-a716-446655440000",
    "name": "Bench Press",
    "description": "Flat bench press with barbell",
    "sets": 5,
    "reps": 12,
    "weight": 85.0,
    "rest_seconds": 90,
    "order_index": 1,
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

#### DELETE /api/v1/workouts/:workout_id/exercises/:exercise_id
Delete an exercise from a workout.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Exercise deleted successfully"
}
```

### Workout Sessions

#### GET /api/v1/workouts/sessions
Get workout sessions with pagination.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `workout_id` (optional): Filter by workout
- `date_from` (optional): Filter from date
- `date_to` (optional): Filter to date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "850e8400-e29b-41d4-a716-446655440000",
      "workout_id": "650e8400-e29b-41d4-a716-446655440000",
      "workout_name": "Upper Body Strength",
      "started_at": "2024-01-15T10:00:00Z",
      "completed_at": "2024-01-15T10:45:00Z",
      "duration_minutes": 45,
      "exercises_completed": 5,
      "total_exercises": 5,
      "notes": "Great workout!",
      "calories_burned": 300,
      "rating": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### POST /api/v1/workouts/sessions
Start a new workout session.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "workout_id": "650e8400-e29b-41d4-a716-446655440000",
  "notes": "Starting my workout"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "850e8400-e29b-41d4-a716-446655440001",
    "workout_id": "650e8400-e29b-41d4-a716-446655440000",
    "started_at": "2024-01-15T10:00:00Z",
    "notes": "Starting my workout"
  }
}
```

#### PUT /api/v1/workouts/sessions/:id
Complete or update workout session.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "completed_at": "2024-01-15T10:45:00Z",
  "duration_minutes": 45,
  "exercises_completed": 5,
  "notes": "Completed all exercises!",
  "calories_burned": 300,
  "rating": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "850e8400-e29b-41d4-a716-446655440000",
    "workout_id": "650e8400-e29b-41d4-a716-446655440000",
    "started_at": "2024-01-15T10:00:00Z",
    "completed_at": "2024-01-15T10:45:00Z",
    "duration_minutes": 45,
    "exercises_completed": 5,
    "total_exercises": 5,
    "notes": "Completed all exercises!",
    "calories_burned": 300,
    "rating": 5,
    "updated_at": "2024-01-15T10:45:00Z"
  }
}
```

#### DELETE /api/v1/workouts/sessions/:id
Delete a workout session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Workout session deleted successfully"
}
```

### Custom Routines

#### GET /api/v1/workouts/routines
Get workout routines with pagination and filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Routine type filter (all, my, public, favorites)
- `difficulty` (optional): Difficulty level filter
- `target_muscle` (optional): Target muscle group filter
- `search` (optional): Search query

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "f50e8400-e29b-41d4-a716-446655440000",
      "name": "Beginner Full Body",
      "description": "Complete full-body workout for beginners",
      "exercises": [
        {
          "id": "g50e8400-e29b-41d4-a716-446655440000",
          "name": "Push-ups",
          "sets": 3,
          "reps": 10,
          "rest_seconds": 60
        }
      ],
      "is_public": true,
      "difficulty": "beginner",
      "target_muscles": ["chest", "back", "legs", "shoulders", "arms"],
      "estimated_duration": 30,
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "johndoe",
        "full_name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg"
      },
      "likes_count": 25,
      "uses_count": 100,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### POST /api/v1/workouts/routines
Create a new workout routine.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Upper Body Strength",
  "description": "Focused upper body workout",
  "exercises": [
    {
      "name": "Push-ups",
      "sets": 4,
      "reps": 12,
      "rest_seconds": 90
    }
  ],
  "is_public": false,
  "difficulty": "intermediate",
  "target_muscles": ["chest", "back", "shoulders", "arms"],
  "estimated_duration": 45
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "f50e8400-e29b-41d4-a716-446655440001",
    "name": "Upper Body Strength",
    "description": "Focused upper body workout",
    "exercises": [
      {
        "id": "g50e8400-e29b-41d4-a716-446655440000",
        "name": "Push-ups",
        "sets": 4,
        "reps": 12,
        "rest_seconds": 90
      }
    ],
    "is_public": false,
    "difficulty": "intermediate",
    "target_muscles": ["chest", "back", "shoulders", "arms"],
    "estimated_duration": 45,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "full_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg"
    },
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### GET /api/v1/workouts/routines/:id
Get a specific routine.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "f50e8400-e29b-41d4-a716-446655440000",
    "name": "Upper Body Strength",
    "description": "Focused upper body workout",
    "exercises": [
      {
        "id": "g50e8400-e29b-41d4-a716-446655440000",
        "name": "Push-ups",
        "sets": 4,
        "reps": 12,
        "rest_seconds": 90
      }
    ],
    "is_public": false,
    "difficulty": "intermediate",
    "target_muscles": ["chest", "back", "shoulders", "arms"],
    "estimated_duration": 45,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "full_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "bio": "Fitness enthusiast"
    },
    "likes": [
      {
        "id": "h50e8400-e29b-41d4-a716-446655440000",
        "user_id": "550e8400-e29b-41d4-a716-446655440001",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "uses": [
      {
        "id": "i50e8400-e29b-41d4-a716-446655440000",
        "user_id": "550e8400-e29b-41d4-a716-446655440001",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### GET /api/v1/workouts/routines/search
Search for workout routines.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `q` (required): Search query
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `difficulty` (optional): Difficulty level filter
- `target_muscle` (optional): Target muscle group filter

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "f50e8400-e29b-41d4-a716-446655440000",
      "name": "Upper Body Strength",
      "description": "Focused upper body workout",
      "difficulty": "intermediate",
      "target_muscles": ["chest", "back", "shoulders", "arms"],
      "estimated_duration": 45,
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "johndoe",
        "full_name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg"
      },
      "likes_count": 25,
      "uses_count": 100,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### POST /api/v1/workouts/routines/:routine_id/share
Share a workout routine.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "is_public": true,
  "share_message": "Check out this amazing routine!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "f50e8400-e29b-41d4-a716-446655440000",
    "is_public": true,
    "share_message": "Check out this amazing routine!",
    "shared_at": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /api/v1/workouts/routines/:routine_id/like
Like a routine.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "h50e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "routine_id": "f50e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /api/v1/workouts/routines/:routine_id/use
Record routine usage.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "i50e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "routine_id": "f50e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Social Features

#### GET /api/v1/social/posts
Get social posts with pagination and filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Post type filter (all, following, workouts, routines)
- `user_id` (optional): Filter by user
- `search` (optional): Search in content

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "950e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "content": "Just completed an amazing workout! 💪",
      "images": ["https://example.com/workout.jpg"],
      "videos": [],
      "type": "achievement",
      "workout_id": "650e8400-e29b-41d4-a716-446655440000",
      "routine_id": null,
      "is_public": true,
      "likes_count": 12,
      "comments_count": 3,
      "shares_count": 2,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### POST /api/v1/social/posts
Create a new social post.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "Just completed an amazing workout! 💪",
  "images": ["https://example.com/workout.jpg"],
  "videos": [],
  "type": "achievement",
  "workout_id": "650e8400-e29b-41d4-a716-446655440000",
  "routine_id": null,
  "is_public": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "950e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "content": "Just completed an amazing workout! 💪",
    "images": ["https://example.com/workout.jpg"],
    "videos": [],
    "type": "achievement",
    "workout_id": "650e8400-e29b-41d4-a716-446655440000",
    "routine_id": null,
    "is_public": true,
    "likes_count": 0,
    "comments_count": 0,
    "shares_count": 0,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### GET /api/v1/social/posts/trending
Get trending social posts.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `timeframe` (optional): Timeframe filter (24h, 7d, 30d) (default: 24h)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "950e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "content": "Just completed an amazing workout! 💪",
      "images": ["https://example.com/workout.jpg"],
      "type": "achievement",
      "likes_count": 50,
      "comments_count": 15,
      "shares_count": 8,
      "trend_score": 0.85,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### GET /api/v1/social/posts/search
Search social posts.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `q` (required): Search query
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Post type filter

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "950e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "content": "Just completed an amazing workout! 💪",
      "images": ["https://example.com/workout.jpg"],
      "type": "achievement",
      "likes_count": 12,
      "comments_count": 3,
      "shares_count": 2,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### POST /api/v1/social/posts/:post_id/share
Share a social post.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "share_message": "Check out this amazing workout!",
  "is_public": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "j50e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "post_id": "950e8400-e29b-41d4-a716-446655440000",
    "share_message": "Check out this amazing workout!",
    "is_public": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /api/v1/social/posts/:post_id/repost
Repost a social post.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "repost_message": "Great workout routine!",
  "is_public": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "k50e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_post_id": "950e8400-e29b-41d4-a716-446655440000",
    "repost_message": "Great workout routine!",
    "is_public": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /api/v1/social/posts/:post_id/like
Like a social post.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "l50e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "post_id": "950e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### DELETE /api/v1/social/posts/:post_id/like
Unlike a social post.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Post unliked successfully"
}
```

#### POST /api/v1/social/posts/:post_id/comments
Add a comment to a social post.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "Great workout! Keep it up!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "m50e8400-e29b-41d4-a716-446655440000",
    "post_id": "950e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "content": "Great workout! Keep it up!",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### GET /api/v1/social/posts/:post_id/comments
Get comments for a social post.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "m50e8400-e29b-41d4-a716-446655440000",
      "post_id": "950e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "content": "Great workout! Keep it up!",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### POST /api/v1/social/follow/:id
Follow a user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "n50e8400-e29b-41d4-a716-446655440000",
    "follower_id": "550e8400-e29b-41d4-a716-446655440000",
    "following_id": "550e8400-e29b-41d4-a716-446655440001",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### DELETE /api/v1/social/follow/:id
Unfollow a user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User unfollowed successfully"
}
```

#### GET /api/v1/social/followers/:id
Get a user's followers.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "n50e8400-e29b-41d4-a716-446655440000",
      "created_at": "2024-01-15T10:30:00Z",
      "follower": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "johndoe",
        "full_name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg",
        "bio": "Fitness enthusiast"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### GET /api/v1/social/following/:id
Get users that a user is following.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "n50e8400-e29b-41d4-a716-446655440000",
      "created_at": "2024-01-15T10:30:00Z",
      "following": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "janedoe",
        "full_name": "Jane Doe",
        "avatar_url": "https://example.com/avatar2.jpg",
        "bio": "Fitness coach"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### AI Features

#### POST /api/v1/ai/chat
Chat with the AI assistant.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "message": "I want to build muscle, what exercises should I do?",
  "session_id": "optional-session-id",
  "context": {
    "workout_id": "650e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "For building muscle, I recommend focusing on compound exercises like squats, deadlifts, and bench press...",
    "session_id": "session-uuid",
    "suggestions": [
      "Create a strength training routine",
      "Add cardio exercises",
      "Focus on specific muscle groups"
    ],
    "conversation_id": "o50e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### GET /api/v1/ai/recommendations
Get AI-powered recommendations.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (optional): Recommendation type (workout, exercise, routine, nutrition)
- `limit` (optional): Number of recommendations (default: 5)

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "workout",
    "recommendations": [
      {
        "id": "rec_1",
        "type": "workout",
        "title": "Strength Training Focus",
        "description": "Based on your preference for strength workouts, here's a comprehensive strength training plan",
        "difficulty": "intermediate",
        "duration": 45,
        "exercises": ["Squats", "Deadlifts", "Bench Press", "Pull-ups"],
        "reason": "Matches your workout history and fitness level"
      }
    ],
    "user_patterns": {
      "preferred_types": {"strength": 5, "cardio": 2},
      "preferred_difficulty": {"intermediate": 4, "advanced": 3},
      "average_duration": 45,
      "total_workouts": 7
    },
    "generated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /api/v1/ai/workout-plan
Generate an AI workout plan.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "goal": "muscle_gain",
  "duration": 12,
  "frequency": 4,
  "difficulty": "intermediate",
  "available_equipment": ["dumbbells", "barbell", "bench"],
  "time_per_session": 60,
  "target_muscles": ["chest", "back", "legs", "shoulders", "arms"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plan_id": "p50e8400-e29b-41d4-a716-446655440000",
    "plan": {
      "title": "AI Generated Muscle Gain Plan",
      "description": "A 12-week workout plan designed for muscle gain",
      "weeks": [
        {
          "week": 1,
          "sessions": [
            {
              "session": 1,
              "exercises": [
                {
                  "name": "Exercise 1",
                  "sets": 3,
                  "reps": 12,
                  "rest_seconds": 60
                }
              ]
            }
          ]
        }
      ],
      "notes": "This plan was generated using AI based on your preferences and goals"
    },
    "parameters": {
      "goal": "muscle_gain",
      "duration": 12,
      "frequency": 4,
      "difficulty": "intermediate",
      "available_equipment": ["dumbbells", "barbell", "bench"],
      "time_per_session": 60,
      "target_muscles": ["chest", "back", "legs", "shoulders", "arms"]
    }
  }
}
```

### Analytics

#### GET /api/v1/analytics/workouts
Get workout analytics.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (optional): Time period (7d, 30d, 90d, 1y) (default: 30d)
- `group_by` (optional): Grouping (day, week, month) (default: day)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "group_by": "day",
    "start_date": "2024-01-01T00:00:00.000Z",
    "end_date": "2024-01-31T23:59:59.999Z",
    "summary": {
      "total_workouts": 25,
      "total_duration": 1125,
      "total_calories": 7500,
      "avg_duration": 45,
      "avg_calories": 300
    },
    "trends": {
      "duration": 15,
      "calories": 20
    },
    "distributions": {
      "types": {"strength": 15, "cardio": 10},
      "difficulty": {"intermediate": 20, "advanced": 5}
    },
    "consistency": 85,
    "grouped_data": [
      {
        "date": "2024-01-01",
        "workouts": 1,
        "duration": 45,
        "calories": 300
      }
    ]
  }
}
```

#### GET /api/v1/analytics/social
Get social analytics.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (optional): Time period (7d, 30d, 90d, 1y) (default: 30d)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "start_date": "2024-01-01T00:00:00.000Z",
    "end_date": "2024-01-31T23:59:59.999Z",
    "posts": {
      "total_posts": 15,
      "total_likes": 150,
      "total_comments": 45,
      "avg_likes_per_post": 10,
      "avg_comments_per_post": 3,
      "by_day": [
        {
          "date": "2024-01-01",
          "posts": 1,
          "likes": 10,
          "comments": 3
        }
      ]
    },
    "followers": {
      "total_new_followers": 25,
      "by_day": [
        {
          "date": "2024-01-01",
          "new_followers": 1
        }
      ]
    }
  }
}
```

#### GET /api/v1/analytics/comprehensive
Get comprehensive user analytics.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (optional): Time period (7d, 30d, 90d, 1y) (default: 30d)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "start_date": "2024-01-01T00:00:00.000Z",
    "end_date": "2024-01-31T23:59:59.999Z",
    "activity_score": 85,
    "engagement": {
      "posts_per_week": 3.5,
      "follower_growth": 25,
      "engagement_rate": 0.15
    },
    "progress": {
      "improvement": "positive",
      "consistency": 0.85,
      "trend": "stable"
    },
    "recommendations": [
      "Try to increase your workout frequency for better results",
      "Share your progress to engage with the community",
      "Set some fitness goals to track your progress"
    ]
  }
}
```

### Notifications

#### GET /api/v1/notifications
Get user notifications.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Notification type filter
- `unread_only` (optional): Show only unread notifications (default: false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "q50e8400-e29b-41d4-a716-446655440000",
      "type": "new_like",
      "title": "New Like",
      "message": "johndoe liked your post!",
      "data": {
        "post_id": "950e8400-e29b-41d4-a716-446655440000",
        "user_id": "550e8400-e29b-41d4-a716-446655440000"
      },
      "from_user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "johndoe",
        "full_name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg"
      },
      "is_read": false,
      "read_at": null,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### PUT /api/v1/notifications/:id/read
Mark a notification as read.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "q50e8400-e29b-41d4-a716-446655440000",
    "is_read": true,
    "read_at": "2024-01-15T10:30:00Z"
  }
}
```

#### PUT /api/v1/notifications/read-all
Mark all notifications as read.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### Settings

#### GET /api/v1/settings
Get user settings.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": {
      "email": true,
      "push": false,
      "sms": false,
      "workout_reminders": true,
      "social_updates": true,
      "achievement_unlocks": true,
      "weekly_reports": true
    },
    "privacy": {
      "profile_public": true,
      "workouts_public": false,
      "posts_public": true,
      "show_email": false,
      "show_phone": false,
      "show_activity_status": true
    },
    "preferences": {
      "theme": "light",
      "language": "en",
      "timezone": "UTC",
      "units": "metric",
      "date_format": "MM/DD/YYYY",
      "time_format": "12h"
    },
    "fitness": {
      "activity_level": "moderate",
      "fitness_goal": "maintain",
      "target_weight": null,
      "current_weight": null,
      "height": null,
      "birth_date": null,
      "gender": null
    },
    "social": {
      "allow_follow_requests": true,
      "allow_direct_messages": true,
      "show_online_status": true,
      "allow_workout_sharing": true
    }
  }
}
```

#### PUT /api/v1/settings
Update user settings.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "notifications": {
    "email": true,
    "push": false,
    "sms": false,
    "workout_reminders": true,
    "social_updates": true,
    "achievement_unlocks": true,
    "weekly_reports": true
  },
  "privacy": {
    "profile_public": true,
    "workouts_public": false,
    "posts_public": true,
    "show_email": false,
    "show_phone": false,
    "show_activity_status": true
  },
  "preferences": {
    "theme": "dark",
    "language": "en",
    "timezone": "UTC",
    "units": "metric",
    "date_format": "MM/DD/YYYY",
    "time_format": "12h"
  },
  "fitness": {
    "activity_level": "moderate",
    "fitness_goal": "muscle_gain",
    "target_weight": 80,
    "current_weight": 75,
    "height": 180,
    "birth_date": "1990-01-01",
    "gender": "male"
  },
  "social": {
    "allow_follow_requests": true,
    "allow_direct_messages": true,
    "show_online_status": true,
    "allow_workout_sharing": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": {...},
    "privacy": {...},
    "preferences": {...},
    "fitness": {...},
    "social": {...}
  }
}
```

### Dashboard

#### GET /api/v1/dashboard
Get dashboard statistics and recent activity.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_workouts": 25,
      "workouts_this_week": 4,
      "total_exercise_time": 1200,
      "current_streak": 7,
      "longest_streak": 21
    },
    "recent_workouts": [
      {
        "id": "850e8400-e29b-41d4-a716-446655440000",
        "workout_name": "Upper Body Strength",
        "completed_at": "2024-01-15T10:45:00Z",
        "duration_minutes": 45
      }
    ],
    "recent_posts": [
      {
        "id": "950e8400-e29b-41d4-a716-446655440000",
        "content": "Just completed an amazing workout! 💪",
        "likes_count": 12,
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "metadata": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "request_id": "req_123456789"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "request_id": "req_123456789"
  }
}
```

## Error Handling

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Access denied |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource already exists or conflict occurred |
| `RATE_LIMIT_EXCEEDED` | Too many requests, please try again later |
| `INTERNAL_ERROR` | Internal server error |
| `DATABASE_ERROR` | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | External service unavailable |

### HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 attempts per 15 minutes
- **API endpoints**: 100 requests per 15 minutes
- **Upload endpoints**: 10 uploads per hour

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Pagination

List endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Pagination information is included in the response:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false,
    "nextPage": 2,
    "prevPage": null
  }
}
```

## Search

Search endpoints support full-text search with the following query parameters:

- `q`: Search query (minimum 2 characters)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

Search results are ranked by relevance and include a `rank` field indicating the match quality.

## Webhooks

The API supports webhooks for real-time notifications. Webhook endpoints can be configured to receive notifications for various events:

- User registration
- Workout completion
- Post creation
- Achievement unlock
- Goal completion

Webhook payloads follow the same format as API responses and include event metadata.

---

**This comprehensive API documentation covers all endpoints, request/response formats, and usage examples for the GymPal Backend API. For the most up-to-date information, please refer to the OpenAPI specification at `/openapi.json`.**
