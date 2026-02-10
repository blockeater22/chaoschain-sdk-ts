/**
 * Provider accessors (Python get_storage_provider / get_compute_provider parity).
 * Returns provider class by name.
 */

import {
  LocalIPFSStorage,
  PinataStorage,
  IrysStorage,
  ZeroGStorage,
  type StorageBackend,
} from '../StorageBackends';
import { LocalComputeProvider } from '../providers/compute';
import type { ComputeProvider } from '../types';

export type StorageProviderName = 'pinata' | 'irys' | 'ipfs' | '0g' | 'local';
export type ComputeProviderName = 'local' | '0g' | 'morpheus' | 'chainlink';

/**
 * Get a storage provider class by name.
 * @param name - Provider name: "pinata", "irys", "ipfs", "0g", "local"
 * @returns Provider class or null if not available
 */
export function getStorageProvider(
  name: StorageProviderName
): (new (...args: any[]) => StorageBackend) | null {
  switch (name) {
    case 'pinata':
      return PinataStorage;
    case 'irys':
      return IrysStorage;
    case 'ipfs':
    case 'local':
      return LocalIPFSStorage;
    case '0g':
      return ZeroGStorage;
    default:
      return null;
  }
}

/**
 * Get a compute provider class by name.
 * @param name - Provider name: "local", "0g", "morpheus", "chainlink"
 * @returns Provider class or null if not available
 */
export function getComputeProvider(
  name: ComputeProviderName
): (new (...args: any[]) => ComputeProvider) | null {
  switch (name) {
    case 'local':
      return LocalComputeProvider;
    case '0g':
    case 'morpheus':
    case 'chainlink':
      return null;
    default:
      return null;
  }
}
