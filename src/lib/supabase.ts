import { createClient } from '@supabase/supabase-js';
import { getServerEnv } from './config.server';
import { publicEnv } from './config.public';

// Get server env for service role key
const serverEnv = getServerEnv();

export const supabase = createClient(
  publicEnv.NEXT_PUBLIC_SUPABASE_URL || '',
  serverEnv.SUPABASE_SERVICE_ROLE_KEY || '',
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
          description: string | null;
          api_key: string;
          webhook_secret: string;
          apple_pass_type_id: string | null;
          google_wallet_class_id: string | null;
          settings: Record<string, any>;
          branding_fonts: {
            header_font: string;
            body_font: string;
          };
          branding_colors: {
            brand_color?: string;
            brand_text_color?: string;
            secondary_color?: string;
            secondary_text_color?: string;
            body_background_color?: string;
            body_content_color?: string;
            header_background_color?: string;
            header_font_color?: string;
            hero_font_color?: string;
            challenge_tile_background_color?: string;
            reward_tile_background_color?: string;
            footer_background_color?: string;
            footer_font_color?: string;
          };
          branding_assets: {
            favicon_url?: string;
            logo_url?: string;
            footer_logo_url?: string;
            overlay_image_url?: string;
            hero_title?: string;
            hero_description?: string;
            hero_background_image_url?: string;
            badge_background_image_url?: string;
          };
          branding_borders: {
            button_border_radius: string;
            input_border_radius: string;
            tiles_border_radius: string;
            cards_border_radius: string;
          };
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
          pass_kind: 'loyalty' | 'rewards';
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
          unused_points: number;
          tier: string | null;
          status: string | null;
          fname: string | null;
          lname: string | null;
          tag_list: string[];
          profile_attributes: Record<string, any>;
          last_sync_at: string | null;
          last_webhook_event_type: string | null;
          last_webhook_event_at: string | null;
          webhook_event_count: number;
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
          program_id: string;
          perk_program_id: number;
          event_type: string;
          event_id: string;
          participant_id: number | null;
          participant_email: string | null;
          participant_uuid: string | null;
          event_data: Record<string, any>;
          processed_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['webhook_events']['Row'], 'id' | 'created_at' | 'processed_at'>;
        Update: Partial<Database['public']['Tables']['webhook_events']['Insert']>;
      };
    };
  };
};