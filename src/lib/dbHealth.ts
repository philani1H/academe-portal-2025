import prisma from './prisma.js';

interface HealthCheckResult {
  isHealthy: boolean;
  latency: number;
  error?: string;
  timestamp: Date;
}

class DatabaseHealthMonitor {
  private lastHealthCheck: HealthCheckResult | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Simple health check query
      await prisma.$queryRaw`SELECT 1`;
      
      const latency = Date.now() - startTime;
      const result: HealthCheckResult = {
        isHealthy: true,
        latency,
        timestamp: new Date()
      };
      
      this.lastHealthCheck = result;
      return result;
    } catch (error: any) {
      const latency = Date.now() - startTime;
      const result: HealthCheckResult = {
        isHealthy: false,
        latency,
        error: error.message,
        timestamp: new Date()
      };
      
      this.lastHealthCheck = result;
      console.error('Database health check failed:', error.message);
      return result;
    }
  }

  startMonitoring(intervalMs: number = 30000) {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, intervalMs);

    console.log(`🏥 Database health monitoring started (${intervalMs}ms interval)`);
  }

  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('🏥 Database health monitoring stopped');
    }
  }

  getLastHealthCheck(): HealthCheckResult | null {
    return this.lastHealthCheck;
  }
}

// Retry wrapper for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.code === 'P2002' || error.code === 'P2025') {
        throw error;
      }

      if (attempt === maxRetries) {
        console.error(`Database operation failed after ${maxRetries} attempts:`, error.message);
        throw error;
      }

      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError!;
}

// Safe query wrapper
export async function safeQuery<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await withRetry(operation);
  } catch (error: any) {
    console.error('Safe query failed:', error.message);
    return fallback;
  }
}

export const dbHealth = new DatabaseHealthMonitor();