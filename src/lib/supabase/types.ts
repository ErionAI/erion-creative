export type GenerationType = 'edit' | 'generate' | 'video';
export type GenerationStatus = 'pending' | 'processing' | 'success' | 'error';

export interface Generation {
  id: string;
  user_id: string;
  type: GenerationType;
  status: GenerationStatus;
  prompt: string;
  resolution: string | null;
  aspect_ratio: string | null;
  model_tier: string | null;
  variations: number | null;
  result_urls: string[] | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Resource {
  id: string;
  user_id: string;
  generation_id: string | null;
  storage_path: string;
  mime_type: string;
  created_at: string;
}

export interface GenerationInsert {
  id?: string;
  user_id: string;
  type: GenerationType;
  status?: GenerationStatus;
  prompt: string;
  resolution?: string | null;
  aspect_ratio?: string | null;
  model_tier?: string | null;
  variations?: number | null;
  result_urls?: string[] | null;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
}

export interface ResourceInsert {
  id?: string;
  user_id: string;
  generation_id?: string | null;
  storage_path: string;
  mime_type: string;
  created_at?: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      generations: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          status: string;
          prompt: string;
          resolution: string | null;
          aspect_ratio: string | null;
          model_tier: string | null;
          variations: number | null;
          result_urls: string[] | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          status?: string;
          prompt: string;
          resolution?: string | null;
          aspect_ratio?: string | null;
          model_tier?: string | null;
          variations?: number | null;
          result_urls?: string[] | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          status?: string;
          prompt?: string;
          resolution?: string | null;
          aspect_ratio?: string | null;
          model_tier?: string | null;
          variations?: number | null;
          result_urls?: string[] | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          user_id: string;
          generation_id: string | null;
          storage_path: string;
          mime_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          generation_id?: string | null;
          storage_path: string;
          mime_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          generation_id?: string | null;
          storage_path?: string;
          mime_type?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
