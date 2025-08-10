import { ConfigService } from '@nestjs/config';

export interface EnvironmentVariables {
  // Application
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  APP_NAME: string;

  // Database
  DATABASE_URL: string;

  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  BCRYPT_ROUNDS: number;

  // CORS
  FRONTEND_URL: string;
  ALLOWED_ORIGINS: string;

  // Development
  ENABLE_DEBUG: boolean;
  ENABLE_SWAGGER: boolean;
  LOG_LEVEL: string;
}

export const validateEnvironment = () => {
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.',
    );
  }

  // Warn about insecure defaults
  if (process.env.NODE_ENV === 'production') {
    if (
      process.env.JWT_SECRET === 'dev-jwt-secret-change-in-production-please'
    ) {
      throw new Error(
        '🚨 SECURITY WARNING: You are using the default JWT_SECRET in production!\n' +
          'Please generate a secure secret with: openssl rand -base64 32',
      );
    }

    if (process.env.DATABASE_URL?.includes('localhost')) {
      console.warn(
        '⚠️  WARNING: Using localhost database URL in production environment',
      );
    }
  }
};

export const getConfig = (
  configService: ConfigService,
): EnvironmentVariables => ({
  NODE_ENV: configService.get<'development' | 'production' | 'test'>(
    'NODE_ENV',
    'development',
  ),
  PORT: configService.get<number>('PORT', 3000),
  APP_NAME: configService.get<string>('APP_NAME', 'Beauty Management System'),

  DATABASE_URL:
    configService.get<string>('DATABASE_URL') ||
    'postgresql://postgres:postgres@localhost:5432/beauty_app',

  JWT_SECRET:
    configService.get<string>('JWT_SECRET') ||
    'dev-jwt-secret-change-in-production-please',
  JWT_EXPIRES_IN: configService.get<string>('JWT_EXPIRES_IN', '24h'),
  BCRYPT_ROUNDS: configService.get<number>('BCRYPT_ROUNDS', 10),

  FRONTEND_URL: configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:5173',
  ),
  ALLOWED_ORIGINS: configService.get<string>(
    'ALLOWED_ORIGINS',
    'http://localhost:3000,http://localhost:5173,https://salonsync.mangalab.io',
  ),

  ENABLE_DEBUG: configService.get<boolean>('ENABLE_DEBUG', true),
  ENABLE_SWAGGER: configService.get<boolean>('ENABLE_SWAGGER', true),
  LOG_LEVEL: configService.get<string>('LOG_LEVEL', 'info'),
});
