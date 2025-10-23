/**
 * OpenAPI Documentation Generator
 *
 * Generates OpenAPI 3.0 specification from route handlers and schemas
 */
export const generateOpenAPISpec = () => {
    return {
        openapi: '3.0.0',
        info: {
            title: 'GymPal API',
            version: '1.0.0',
            description: 'Backend API for GymPal - AI-powered fitness application',
            contact: {
                name: 'GymPal Team',
                email: 'support@gympal.app',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
            {
                url: 'https://api.gympal.app',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT authentication token',
                },
            },
            schemas: {
                // Error responses
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: {
                            type: 'object',
                            properties: {
                                code: { type: 'string', example: 'VALIDATION_ERROR' },
                                message: { type: 'string', example: 'Validation failed' },
                                details: { type: 'object' },
                            },
                        },
                    },
                },
                // Success responses
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string' },
                        data: { type: 'object' },
                    },
                },
                // Pagination
                Pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 20 },
                        total: { type: 'integer', example: 100 },
                        totalPages: { type: 'integer', example: 5 },
                        hasNext: { type: 'boolean', example: true },
                        hasPrev: { type: 'boolean', example: false },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication and authorization endpoints',
            },
            {
                name: 'Users',
                description: 'User profile management endpoints',
            },
            {
                name: 'Workouts',
                description: 'Workout and exercise management endpoints',
            },
            {
                name: 'Social',
                description: 'Social features including posts, comments, and follows',
            },
            {
                name: 'Routines',
                description: 'Workout routine management endpoints',
            },
            {
                name: 'Dashboard',
                description: 'User dashboard and analytics endpoints',
            },
            {
                name: 'Settings',
                description: 'User settings and preferences endpoints',
            },
        ],
        paths: {},
    };
};
