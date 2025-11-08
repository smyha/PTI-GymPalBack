# GymPal Backend API - Architecture Documentation

## Overview

GymPal Backend is a comprehensive RESTful API built with **Hono**, **TypeScript**, and **Supabase** for a fitness tracking application with social features. The API provides endpoints for user authentication, workout management, exercise tracking, social interactions, and analytics.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Request Flow](#request-flow)
- [Authentication Flow](#authentication-flow)
- [Database Schema](#database-schema)
- [Module Architecture](#module-architecture)
- [API Endpoints](#api-endpoints)

## Architecture Overview

```mermaid
graph TB
    Client[Client Application] -->|HTTP/HTTPS| Server[Hono Server]
    Server -->|Middleware Layer| MW[Middleware]
    MW --> AuthMW[Authentication<br/>Validation<br/>Logging<br/>Rate Limiting]
    AuthMW --> Routes[Route Handlers]
    Routes --> Services[Business Logic Services]
    Services --> Database[(Supabase<br/>PostgreSQL)]
    Services --> AuthService[Supabase Auth]
    
    Routes --> Response[Formatted Response]
    Response --> Client
    
    style Server fill:#4a90e2
    style Database fill:#3fcf8e
    style AuthService fill:#ff6b6b
    style Routes fill:#feca57
    style Services fill:#48dbfb
```

## Technology Stack

### Core Framework
- **Hono**: Fast, lightweight web framework for the edge
- **TypeScript**: Type-safe JavaScript
- **Node.js**: Runtime environment

### Database & Auth
- **Supabase**: PostgreSQL database with built-in auth
- **PostgreSQL**: Relational database
- **Row Level Security (RLS)**: Database-level security

### Additional Tools
- **Zod**: Schema validation
- **Pino**: Logging
- **Nodemailer**: Email notifications

## Project Structure

```mermaid
graph TD
    Root[GymPal Backend] --> Src[src/]
    Root --> Dist[dist/]
    Root --> Docs[docs/]
    Root --> Supabase[supabase/]
    
    Src --> Core[core/]
    Src --> Modules[modules/]
    Src --> Middleware[middleware/]
    Src --> Plugins[plugins/]
    Src --> App[app.ts]
    Src --> Server[server.ts]
    
    Core --> Config[config/]
    Core --> Utils[utils/]
    Core --> Constants[constants/]
    Core --> Routes[routes.ts]
    
    Modules --> Auth[auth/]
    Modules --> Users[users/]
    Modules --> Workouts[workouts/]
    Modules --> Exercises[exercises/]
    Modules --> Social[social/]
    Modules --> Dashboard[dashboard/]
    Modules --> Personal[personal/]
    Modules --> Settings[settings/]
    
    Auth --> AuthHandlers[handlers.ts]
    Auth --> AuthService[service.ts]
    Auth --> AuthRoutes[routes.ts]
    Auth --> AuthSchemas[schemas.ts]
    
    Middleware --> AuthMW[auth.ts]
    Middleware --> ErrorMW[error.ts]
    Middleware --> LoggingMW[logging.ts]
    Middleware --> ValidationMW[validation.ts]
    Middleware --> RateLimitMW[rate-limit.ts]
    
    style Root fill:#4a90e2
    style Modules fill:#feca57
    style Core fill:#48dbfb
    style Middleware fill:#ff6b6b
```

## Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Middleware
    participant Handler
    participant Service
    participant Database
    
    Client->>Server: HTTP Request
    Server->>Middleware: Route Matching
    
    alt Global Middleware
        Middleware->>Middleware: Pretty JSON
        Middleware->>Middleware: Logging
        Middleware->>Middleware: CORS
        Middleware->>Middleware: Rate Limiting
    end
    
    alt Protected Route
        Middleware->>Middleware: Authentication
        Middleware->>Middleware: Token Validation
    end
    
    alt Validation Required
        Middleware->>Middleware: Request Validation
        Middleware->>Middleware: Schema Check (Zod)
    end
    
    Middleware->>Handler: Forward Request
    
    Handler->>Service: Business Logic Call
    Service->>Database: Query/Transaction
    Database->>Service: Result Set
    Service->>Handler: Processed Data
    
    Handler->>Server: Formatted Response
    Server->>Client: JSON Response
    
    alt Error Occurs
        Handler->>Server: Throw Error
        Server->>Middleware: Error Handler
        Middleware->>Client: Error Response
    end
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant API
    participant AuthService
    participant SupabaseAuth
    
    User->>Client: Enter Credentials
    Client->>API: POST /api/v1/auth/login
    API->>API: Validate Input (Zod)
    API->>AuthService: login(credentials)
    AuthService->>SupabaseAuth: signInWithPassword()
    SupabaseAuth->>AuthService: Session + User
    AuthService->>API: AuthResponse (token)
    API->>Client: { user, token, refresh_token }
    Client->>Client: Store Tokens
    
    Note over Client: Use token in subsequent requests
    
    Client->>API: GET /api/v1/users/profile<br/>Authorization: Bearer {token}
    API->>API: Verify Token (middleware)
    API->>API: Extract User from Token
    API->>Handler: Process Request
    Handler->>Client: Protected Resource
```

## Module Architecture

Each module follows a consistent structure:

```mermaid
graph LR
    Routes[routes.ts] --> Handlers[handlers.ts]
    Handlers --> Service[service.ts]
    Service --> Database[(Database)]
    Service --> External[External Services]
    
    Routes -.-> Schemas[schemas.ts]
    Handlers -.-> Types[types.ts]
    Service -.-> Types
    
    Routes --> AuthMW[Authentication<br/>Middleware]
    Routes --> ValMW[Validation<br/>Middleware]
    
    style Routes fill:#4a90e2
    style Handlers fill:#feca57
    style Service fill:#48dbfb
    style Database fill:#3fcf8e
```

### Module Responsibilities

1. **routes.ts**: Defines HTTP endpoints, applies middleware, connects routes to handlers
2. **handlers.ts**: HTTP request handlers that process requests, call services, format responses
3. **service.ts**: Business logic layer that interacts with database and external services
4. **schemas.ts**: Zod validation schemas for request/response validation
5. **types.ts**: TypeScript type definitions for the module

## Database Schema

```mermaid
erDiagram
    profiles ||--o{ workouts : creates
    profiles ||--o{ exercises : creates
    profiles ||--o{ posts : creates
    profiles ||--o{ likes : gives
    
    workouts ||--o{ workout_exercises : contains
    exercises ||--o{ workout_exercises : used_in
    
    posts ||--o{ likes : receives
    
    profiles {
        uuid id PK
        string username
        string email
        string full_name
        date date_of_birth
        string gender
        text bio
        string avatar_url
        string fitness_level
        timestamp created_at
    }
    
    workouts {
        uuid id PK
        uuid user_id FK
        string name
        date workout_date
        integer duration_minutes
        text notes
        timestamp created_at
    }
    
    exercises {
        uuid id PK
        uuid user_id FK
        string name
        string category
        array muscle_groups
        string equipment
        text description
        boolean is_public
    }
    
    posts {
        uuid id PK
        uuid user_id FK
        text content
        uuid workout_id FK
        integer likes_count
        timestamp created_at
    }
    
    likes {
        uuid id PK
        uuid user_id FK
        uuid post_id FK
        timestamp created_at
    }
```

## API Endpoints

### Authentication Module (`/api/v1/auth`)

```mermaid
graph LR
    Auth[Auth Module] --> Register[POST /register]
    Auth --> Login[POST /login]
    Auth --> Me[GET /me]
    Auth --> Logout[POST /logout]
    Auth --> Refresh[POST /refresh]
    Auth --> Reset[POST /reset-password]
    Auth --> Change[PUT /change-password]
    Auth --> Delete[DELETE /delete-account]
    
    style Auth fill:#4a90e2
    style Register fill:#feca57
    style Login fill:#feca57
```

### Users Module (`/api/v1/users`)

```mermaid
graph LR
    Users[Users Module] --> Profile[GET /profile]
    Users --> GetById[GET /:id]
    Users --> Update[PUT /profile]
    Users --> Search[GET /search]
    Users --> Stats[GET /stats]
    
    style Users fill:#4a90e2
```

### Workouts Module (`/api/v1/workouts`)

```mermaid
graph LR
    Workouts[Workouts Module] --> Create[POST /]
    Workouts --> List[GET /]
    Workouts --> GetById[GET /:id]
    Workouts --> Update[PUT /:id]
    Workouts --> Delete[DELETE /:id]
    
    style Workouts fill:#4a90e2
```

### Exercises Module (`/api/v1/exercises`)

```mermaid
graph LR
    Exercises[Exercises Module] --> Create[POST /]
    Exercises --> List[GET /]
    Exercises --> GetById[GET /:id]
    Exercises --> Categories[GET /categories]
    Exercises --> MuscleGroups[GET /muscle-groups]
    Exercises --> Equipment[GET /equipment-types]
    Exercises --> Update[PUT /:id]
    Exercises --> Delete[DELETE /:id]
    
    style Exercises fill:#4a90e2
```

### Social Module (`/api/v1/social`)

```mermaid
graph LR
    Social[Social Module] --> CreatePost[POST /posts]
    Social --> ListPosts[GET /posts]
    Social --> GetPost[GET /posts/:id]
    Social --> UpdatePost[PUT /posts/:id]
    Social --> DeletePost[DELETE /posts/:id]
    Social --> LikePost[POST /posts/:id/like]
    Social --> UnlikePost[DELETE /posts/:id/like]
    
    style Social fill:#4a90e2
```

### Dashboard Module (`/api/v1/dashboard`)

```mermaid
graph LR
    Dashboard[Dashboard Module] --> Overview[GET /overview]
    Dashboard --> Stats[GET /stats]
    Dashboard --> Activity[GET /recent-activity]
    
    style Dashboard fill:#4a90e2
```

## Error Handling Flow

```mermaid
graph TD
    Request[HTTP Request] --> Handler[Handler]
    Handler -->|Success| Success[Success Response]
    Handler -->|Error| Catch[Catch Block]
    Catch --> Logger[Log Error]
    Logger --> ErrorType{Error Type}
    
    ErrorType -->|HTTPException| HTTPError[HTTP Exception Response]
    ErrorType -->|AppError| AppErrorResp[App Error Response]
    ErrorType -->|ZodError| ValidationError[Validation Error Response]
    ErrorType -->|JWT Error| AuthError[Authentication Error Response]
    ErrorType -->|Unknown| DefaultError[Default Error Response]
    
    HTTPError --> Client[Client]
    AppErrorResp --> Client
    ValidationError --> Client
    AuthError --> Client
    DefaultError --> Client
    
    style Handler fill:#4a90e2
    style ErrorType fill:#ff6b6b
```

## Security Layers

```mermaid
graph TB
    Request[Incoming Request] --> CORS[CORS Check]
    CORS --> RateLimit[Rate Limiting]
    RateLimit --> Auth{Authentication<br/>Required?}
    
    Auth -->|Yes| TokenCheck[Token Validation]
    Auth -->|No| Validation
    
    TokenCheck -->|Valid| Validation[Request Validation]
    TokenCheck -->|Invalid| AuthError[401 Unauthorized]
    
    Validation -->|Valid| Handler[Request Handler]
    Validation -->|Invalid| ValidationError[400 Bad Request]
    
    Handler --> Service[Business Logic]
    Service --> RLS[Row Level Security]
    RLS --> Database[(Database)]
    
    style RateLimit fill:#ff6b6b
    style TokenCheck fill:#feca57
    style RLS fill:#3fcf8e
```

## Deployment Architecture

```mermaid
graph TB
    Internet[Internet] --> LB[Load Balancer]
    LB --> App1[App Instance 1]
    LB --> App2[App Instance 2]
    LB --> App3[App Instance N]
    
    App1 --> Supabase[(Supabase<br/>PostgreSQL)]
    App2 --> Supabase
    App3 --> Supabase
    
    Supabase --> AuthService[Supabase Auth]
    Supabase --> Storage[Supabase Storage]
    
    App1 --> Logger[Logging Service]
    App2 --> Logger
    App3 --> Logger
    
    style LB fill:#4a90e2
    style Supabase fill:#3fcf8e
    style Logger fill:#48dbfb
```

---

## API Response Formats

### Standard Response Structure

All API endpoints follow a consistent response format:

```json
{
  "success": true,
  "message": "Optional success message",
  "data": { ... },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Paginated Responses

List endpoints with pagination include:

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Responses

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Recent Improvements

### Enhanced Social Posts

- **Author Information**: All post responses now include complete author details (id, username, fullName, avatar)
- **Engagement Metrics**: Posts include `likesCount`, `commentsCount`, and `isLiked` status
- **Standardized Pagination**: List endpoints use consistent pagination format with `page`, `limit`, `total`, `totalPages`, `hasNext`, `hasPrev`

### Improved Personal Information

- **Null Values by Default**: Personal info and fitness profile endpoints return objects with null values for unset fields instead of 404 errors
- This ensures frontend always receives valid response structures, improving error handling

### Enhanced User Profiles

- **Embedded Statistics**: User profile endpoint (`GET /api/v1/users/profile`) now includes user statistics directly in the response
- Statistics include: `totalWorkouts`, `totalExercises`, `totalPosts`
- Reduces the need for separate API calls to fetch user statistics

### Consistent Data Formats

- All timestamps use ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`)
- All UUIDs are consistently formatted
- IDs are always present and accessible at the root level or within `data` object

---

## Module Details

### Authentication Module
- Handles user registration, login, logout
- Token management (access & refresh tokens)
- Password reset and change
- Account deletion

### Users Module
- Profile management (CRUD operations) with embedded statistics
- User search and discovery
- User statistics and analytics

### Workouts Module
- Create, read, update, delete workouts
- Workout history and filtering
- Workout templates

### Exercises Module
- Exercise library management
- Custom exercise creation
- Exercise categorization and filtering
- Reference data (categories, muscle groups, equipment)

### Social Module
- Post creation and management
- Like/unlike functionality
- Social feed and activity

### Dashboard Module
- Overview statistics
- Time-based analytics
- Recent activity feed

### Personal Module
- Personal information management
- Fitness profile (metrics, goals, preferences)

### Settings Module
- General settings
- Notification preferences
- Privacy settings

---

**Documentation Version**: 1.1.0  
**Last Updated**: 2024  
**Maintained by**: GymPal Development Team

### Changelog

#### Version 1.1.0 (2024)
- Enhanced social posts with author information and engagement metrics
- Improved personal information endpoints (null values by default)
- User profiles now include embedded statistics
- Standardized pagination across list endpoints
- Consistent response formats across all endpoints

