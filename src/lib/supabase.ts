import { createClient } from '@supabase/supabase-js';
import { config } from './config';

export const supabase = createClient(
  config.NEXT_PUBLIC_SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type Database = {
  public: {
    Tables: {
      programs: {
        Row: {
          id: string;
          perk_program_id: number;
          name: string;
          api_key: string;
          webhook_secret: string;
          apple_pass_type_id: string | null;
          google_wallet_class_id: string | null;
          settings: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['programs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['programs']['Insert']>;
      };
      templates: {
        Row: {
          id: string;
          program_id: string;
          pass_type: 'loyalty' | 'rewards';
          version: number;
          apple_template: Record<string, any>;
          google_template: Record<string, any>;
          fields_mapping: Record<string, any>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['templates']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['templates']['Insert']>;
      };
      participants: {
        Row: {
          id: string;
          perk_uuid: string;
          program_id: string;
          email: string;
          perk_participant_id: string;
          points: number;
          tier: string | null;
          status: string | null;
          profile_attributes: Record<string, any>;
          last_sync_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['participants']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['participants']['Insert']>;
      };
      passes: {
        Row: {
          id: string;
          perk_uuid: string;
          program_id: string;
          pass_kind: 'loyalty' | 'rewards';
          apple_serial_number: string | null;
          apple_auth_token: string | null;
          google_object_id: string | null;
          pass_data: Record<string, any>;
          data_hash: string | null;
          version: number;
          last_updated_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['passes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['passes']['Insert']>;
      };
      jobs: {
        Row: {
          id: string;
          type: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          payload: Record<string, any>;
          result: Record<string, any> | null;
          error: string | null;
          attempts: number;
          max_attempts: number;
          scheduled_at: string;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['jobs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>;
      };
      webhook_events: {
        Row: {
          id: string;
          event_id: string;
          event_type: string;
          payload: Record<string, any>;
          processed_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['webhook_events']['Row'], 'id' | 'created_at' | 'processed_at'>;
        Update: Partial<Database['public']['Tables']['webhook_events']['Insert']>;
      };
    };
  };
};