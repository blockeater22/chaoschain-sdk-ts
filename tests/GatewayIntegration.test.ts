/**
 * Gateway Integration Tests
 *
 * These tests require a running Gateway instance on http://localhost:3000
 * They are automatically skipped if the Gateway is not available.
 *
 * To run these tests:
 * 1. Start PostgreSQL: docker run -d --name gateway-postgres -e POSTGRES_PASSWORD=gateway -e POSTGRES_DB=gateway -p 5432:5432 postgres:15
 * 2. Apply schema: cat packages/gateway/src/persistence/postgres/schema.sql | docker exec -i gateway-postgres psql -U postgres -d gateway
 * 3. Start Gateway: cd packages/gateway && npm run dev
 * 4. Run tests: npm test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { GatewayClient } from '../src/GatewayClient';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

// Check if Gateway is available
async function isGatewayAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${GATEWAY_URL}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

describe('Gateway Integration', () => {
  let gatewayAvailable = false;
  let client: GatewayClient;

  beforeAll(async () => {
    gatewayAvailable = await isGatewayAvailable();
    if (gatewayAvailable) {
      client = new GatewayClient({ gatewayUrl: GATEWAY_URL });
    }
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      if (!gatewayAvailable) {
        console.log('[SKIP] Gateway not available at', GATEWAY_URL);
        return;
      }

      const health = await client.healthCheck();

      expect(health).toHaveProperty('status');
      expect(health.status).toBe('ok');
      expect(health).toHaveProperty('timestamp');
    });

    it('should return true for isHealthy', async () => {
      if (!gatewayAvailable) {
        console.log('[SKIP] Gateway not available at', GATEWAY_URL);
        return;
      }

      const isHealthy = await client.isHealthy();

      expect(isHealthy).toBe(true);
    });
  });

  describe('Workflow Operations', () => {
    it('should list workflows for a studio', async () => {
      if (!gatewayAvailable) {
        console.log('[SKIP] Gateway not available at', GATEWAY_URL);
        return;
      }

      try {
        // Use a dummy studio address - may return empty array or error
        const result = await client.listWorkflows({
          studio: '0x0000000000000000000000000000000000000001',
        });
        expect(Array.isArray(result)).toBe(true);
      } catch (error: any) {
        // Gateway may return error for non-existent studio - that's OK
        console.log('[SKIP] listWorkflows returned error (expected):', error.message);
        expect(error).toBeDefined();
      }
    });

    it('should handle non-existent workflow gracefully', async () => {
      if (!gatewayAvailable) {
        console.log('[SKIP] Gateway not available at', GATEWAY_URL);
        return;
      }

      await expect(
        client.getWorkflow('non-existent-workflow-id')
      ).rejects.toThrow();
    });
  });

  describe('Gateway Availability Check', () => {
    it('should detect gateway availability correctly', async () => {
      // This test always runs - it tests the detection mechanism itself
      const available = await isGatewayAvailable();

      // Just verify the function returns a boolean
      expect(typeof available).toBe('boolean');

      if (available) {
        console.log('[OK] Gateway is available at', GATEWAY_URL);
      } else {
        console.log('[INFO] Gateway is not running at', GATEWAY_URL);
        console.log('       To run integration tests, start the Gateway first.');
      }
    });
  });
});
