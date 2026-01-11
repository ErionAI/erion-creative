import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { Database } from '@/lib/supabase/types';

type Generation = Database['public']['Tables']['generations']['Row'];
type GenerationStatus = 'pending' | 'processing' | 'success' | 'error';

const POLL_INTERVAL = 2000; // 2 seconds

interface UseGenerationOptions {
  onSuccess?: (generation: Generation) => void;
  onError?: (error: string) => void;
}

interface UseGenerationReturn {
  generation: Generation | null;
  status: GenerationStatus | null;
  isLoading: boolean;
  error: string | null;
  startPolling: (generationId: string) => void;
  stopPolling: () => void;
}

export type { Generation };

export function useGeneration(options?: UseGenerationOptions): UseGenerationReturn {
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGeneration = useCallback(async (id: string) => {
    const supabase = createClient();

    const { data, error: fetchError } = await supabase
      .from('generations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      setError(fetchError.message);
      setIsLoading(false);
      return null;
    }

    return data as Generation;
  }, []);

  useEffect(() => {
    if (!generationId) return;

    let intervalId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const poll = async () => {
      const data = await fetchGeneration(generationId);

      if (!isMounted || !data) return;

      setGeneration(data);

      if (data.status === 'success') {
        setIsLoading(false);
        if (intervalId) clearInterval(intervalId);
        options?.onSuccess?.(data);
      } else if (data.status === 'error') {
        setIsLoading(false);
        setError(data.error_message || 'Generation failed');
        if (intervalId) clearInterval(intervalId);
        options?.onError?.(data.error_message || 'Generation failed');
      }
      // Continue polling if status is 'pending' or 'processing'
    };

    setIsLoading(true);
    setError(null);
    poll();
    intervalId = setInterval(poll, POLL_INTERVAL);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [generationId, fetchGeneration, options]);

  const startPolling = useCallback((id: string) => {
    setGeneration(null);
    setError(null);
    setGenerationId(id);
  }, []);

  const stopPolling = useCallback(() => {
    setGenerationId(null);
    setIsLoading(false);
  }, []);

  return {
    generation,
    status: (generation?.status as GenerationStatus) ?? null,
    isLoading,
    error,
    startPolling,
    stopPolling,
  };
}
