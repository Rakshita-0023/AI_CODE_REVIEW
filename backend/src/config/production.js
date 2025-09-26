// Production database configuration and utilities
import { Sequelize } from 'sequelize';

export const productionConfig = {
  // Database connection with optimized settings
  database: {
    pool: {
      max: 20,        // Maximum connections
      min: 5,         // Minimum connections
      acquire: 30000, // Maximum time to get connection
      idle: 10000,    // Maximum idle time
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      connectTimeout: 60000,
      socketTimeout: 60000,
    },
    retry: {
      max: 3,
      backoffBase: 1000,
      backoffExponent: 1.5,
    }
  },

  // Rate limiting for production
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Security headers
  security: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }
};

// Database health check
export const checkDatabaseHealth = async (sequelize) => {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query('SELECT NOW() as current_time');
    return {
      status: 'healthy',
      timestamp: results[0].current_time,
      connectionPool: {
        total: sequelize.connectionManager.pool.size,
        used: sequelize.connectionManager.pool.used,
        waiting: sequelize.connectionManager.pool.pending
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};