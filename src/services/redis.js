import { createClient } from 'redis';
import { logger } from './logger.js';

let redis;

// Initialize Redis client
async function initializeRedis() {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redis = createClient({
      url: redisUrl,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis server refused connection');
          return new Error('Redis server refused connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          logger.error('Too many Redis connection attempts');
          return undefined;
        }
        // Reconnect after
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redis.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redis.on('connect', () => {
      logger.info('✅ Connected to Redis');
    });

    redis.on('disconnect', () => {
      logger.warn('❌ Disconnected from Redis');
    });

    await redis.connect();
    
    // Test the connection
    await redis.ping();
    logger.info('✅ Redis connection test successful');
    
  } catch (error) {
    logger.error('❌ Failed to connect to Redis:', error);
    // Don't exit process, just log the error
    // The app can work without Redis, just with reduced performance
  }
}

// Cache management functions
class CacheService {
  constructor() {
    this.defaultTTL = {
      session: 24 * 60 * 60, // 24 hours
      decision: 60 * 60, // 1 hour
      analytics: 30 * 60, // 30 minutes
      ml_result: 60 * 60, // 1 hour
      user_profile: 60 * 60 // 1 hour
    };
  }

  async get(key) {
    if (!redis || !redis.isOpen) {
      return null;
    }

    try {
      const result = await redis.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    if (!redis || !redis.isOpen) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setEx(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    if (!redis || !redis.isOpen) {
      return false;
    }

    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key) {
    if (!redis || !redis.isOpen) {
      return false;
    }

    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  // Specialized cache methods
  async cacheUserSession(sessionId, userData, ttl = null) {
    const key = `session:${sessionId}`;
    return await this.set(key, userData, ttl || this.defaultTTL.session);
  }

  async getUserSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.get(key);
  }

  async invalidateUserSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.del(key);
  }

  async cacheDecisionResult(decisionId, result, ttl = null) {
    const key = `decision:${decisionId}`;
    return await this.set(key, result, ttl || this.defaultTTL.decision);
  }

  async getDecisionResult(decisionId) {
    const key = `decision:${decisionId}`;
    return await this.get(key);
  }

  async cacheMLResult(inputHash, result, ttl = null) {
    const key = `ml:${inputHash}`;
    return await this.set(key, result, ttl || this.defaultTTL.ml_result);
  }

  async getMLResult(inputHash) {
    const key = `ml:${inputHash}`;
    return await this.get(key);
  }

  async cacheAnalytics(userId, type, data, ttl = null) {
    const key = `analytics:${userId}:${type}`;
    return await this.set(key, data, ttl || this.defaultTTL.analytics);
  }

  async getAnalytics(userId, type) {
    const key = `analytics:${userId}:${type}`;
    return await this.get(key);
  }

  async cacheUserProfile(userId, profile, ttl = null) {
    const key = `user:${userId}`;
    return await this.set(key, profile, ttl || this.defaultTTL.user_profile);
  }

  async getUserProfile(userId) {
    const key = `user:${userId}`;
    return await this.get(key);
  }

  async invalidateUserProfile(userId) {
    const key = `user:${userId}`;
    return await this.del(key);
  }

  // Batch operations
  async mget(keys) {
    if (!redis || !redis.isOpen || keys.length === 0) {
      return [];
    }

    try {
      const results = await redis.mGet(keys);
      return results.map(result => result ? JSON.parse(result) : null);
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs, ttl = null) {
    if (!redis || !redis.isOpen || keyValuePairs.length === 0) {
      return false;
    }

    try {
      const serializedPairs = [];
      for (let i = 0; i < keyValuePairs.length; i += 2) {
        serializedPairs.push(keyValuePairs[i]); // key
        serializedPairs.push(JSON.stringify(keyValuePairs[i + 1])); // value
      }

      await redis.mSet(serializedPairs);

      // Set TTL for each key if specified
      if (ttl) {
        const promises = [];
        for (let i = 0; i < keyValuePairs.length; i += 2) {
          promises.push(redis.expire(keyValuePairs[i], ttl));
        }
        await Promise.all(promises);
      }

      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  // Pattern-based operations
  async deletePattern(pattern) {
    if (!redis || !redis.isOpen) {
      return 0;
    }

    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const deleted = await redis.del(keys);
      return deleted;
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  // Health check
  async ping() {
    if (!redis || !redis.isOpen) {
      return false;
    }

    try {
      const result = await redis.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping error:', error);
      return false;
    }
  }

  // Stats
  async getStats() {
    if (!redis || !redis.isOpen) {
      return null;
    }

    try {
      const info = await redis.info('memory');
      const stats = {};
      
      info.split('\r\n').forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key] = value;
        }
      });

      return {
        connected: redis.isOpen,
        memory: {
          used: stats.used_memory_human,
          peak: stats.used_memory_peak_human,
          rss: stats.used_memory_rss_human
        }
      };
    } catch (error) {
      logger.error('Redis stats error:', error);
      return null;
    }
  }
}

// Initialize Redis on module load
initializeRedis();

// Create and export cache service instance
const cache = new CacheService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (redis && redis.isOpen) {
    logger.info('Closing Redis connection...');
    await redis.quit();
  }
});

process.on('SIGINT', async () => {
  if (redis && redis.isOpen) {
    logger.info('Closing Redis connection...');
    await redis.quit();
  }
});

export { redis, cache };
export default cache;
