/**
 * @file src/hooks/useNetworkStatus.ts
 * @description Hook React para verificação em tempo real se o computador está online (4.1.1.D6.6)
 */

import { useState, useEffect, useCallback } from 'react';
import { NetworkStatusService, NetworkStatus } from '../services/networkStatusService';

export function useNetworkStatus(): {
  status: NetworkStatus;
  isOnline: boolean;
  latencyMs: number | null;
  quality: NetworkStatus['quality'];
  isChecking: boolean;
  checkNow: () => Promise<NetworkStatus>;
  clearHistory: () => void;
} {
  const [status, setStatus] = useState<NetworkStatus>(() => NetworkStatusService.getStatus());

  useEffect(() => {
    const unsubscribe = NetworkStatusService.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const checkNow = useCallback(() => {
    return NetworkStatusService.checkNow({ reason: 'manual_hook_call' });
  }, []);

  const clearHistory = useCallback(() => {
    NetworkStatusService.clearHistory();
  }, []);

  return {
    status,
    isOnline: status.isOnline,
    latencyMs: status.latencyMs,
    quality: status.quality,
    isChecking: status.isChecking,
    checkNow,
    clearHistory,
  };
}
