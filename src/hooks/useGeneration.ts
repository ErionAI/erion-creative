import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import type { Database } from '@/lib/supabase/types';

type Generation = Database['public']['Tables']['generations']['Row'];
type GenerationStatus = 'pending' | 'processing' | 'success' | 'error';

const POLL_INTERVAL = 5000;

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

const fetchGeneration = async (id: string): Promise<Generation> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export function useGeneration(options?: UseGenerationOptions): UseGenerationReturn {
  const [generationId, setGenerationId] = useState<string | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const { data: generation, error, isLoading } = useQuery({
    queryKey: ['generation', generationId],
    queryFn: () => fetchGeneration(generationId!),
    enabled: !!generationId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return POLL_INTERVAL;
      if (data.status === 'success' || data.status === 'error') {
        return false;
      }
      return POLL_INTERVAL;
    },
  });

  useEffect(() => {
    if (!generation) return;

    if (generation.status === 'success') {
      optionsRef.current?.onSuccess?.(generation);
    } else if (generation.status === 'error') {
      optionsRef.current?.onError?.(generation.error_message || 'Generation failed');
    }
  }, [generation]);

  const startPolling = useCallback((id: string) => {
    setGenerationId(id);
  }, []);

  const stopPolling = useCallback(() => {
    setGenerationId(null);
  }, []);

  return {
    generation: generation ?? null,
    status: (generation?.status as GenerationStatus) ?? null,
    isLoading: isLoading && !!generationId,
    error: error?.message ?? null,
    startPolling,
    stopPolling,
  };
}
