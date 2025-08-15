import { z } from 'zod';
import { getServerEnv } from './config.server';

const ParticipantSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  uuid: z.string(),
  points: z.number().int().default(0),
  tier: z.string().optional(),
  status: z.string().optional(),
  profile_attributes: z.record(z.any()).default({}),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Participant = z.infer<typeof ParticipantSchema>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

class PerkAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'PerkAPIError';
  }
}

export class PerkClient {
  private baseUrl: string;
  private apiKey: string;
  private maxRetries = 3;
  private initialRetryDelay = 1000;
  private maxRetryDelay = 60000;

  constructor(apiKey?: string, baseUrl?: string) {
    const serverEnv = getServerEnv();
    this.apiKey = apiKey || serverEnv.PERK_API_KEY || '';
    this.baseUrl = baseUrl || serverEnv.PERK_BASE_URL || serverEnv.PERK_API_URL || 'https://perk.studio';
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateBackoff(attempt: number, isRateLimit: boolean = false): number {
    if (isRateLimit) {
      return Math.min(this.initialRetryDelay * Math.pow(3, attempt), this.maxRetryDelay);
    }
    return Math.min(this.initialRetryDelay * Math.pow(2, attempt), this.maxRetryDelay);
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
    attempt = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (response.status === 429) {
        if (attempt < this.maxRetries) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter 
            ? parseInt(retryAfter) * 1000 
            : this.calculateBackoff(attempt, true);
          
          console.log(`Rate limited. Retrying after ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`);
          await this.sleep(delay);
          return this.request<T>(endpoint, options, attempt + 1);
        }
        throw new PerkAPIError('Rate limit exceeded after max retries', 429);
      }

      if (!response.ok) {
        const errorBody = await response.text();
        
        if (response.status >= 500 && attempt < this.maxRetries) {
          const delay = this.calculateBackoff(attempt);
          console.log(`Server error ${response.status}. Retrying after ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`);
          await this.sleep(delay);
          return this.request<T>(endpoint, options, attempt + 1);
        }
        
        throw new PerkAPIError(
          `API request failed: ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof PerkAPIError) {
        throw error;
      }
      
      if (attempt < this.maxRetries && error instanceof Error) {
        const delay = this.calculateBackoff(attempt);
        console.log(`Network error: ${error.message}. Retrying after ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`);
        await this.sleep(delay);
        return this.request<T>(endpoint, options, attempt + 1);
      }
      
      throw new PerkAPIError(
        `Network request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0
      );
    }
  }

  async createParticipant(data: {
    email: string;
    profile_attributes?: Record<string, any>;
  }): Promise<Participant> {
    const response = await this.request<{ participant: any }>('/api/v2/participants', {
      method: 'POST',
      body: { participant: data },
    });
    return ParticipantSchema.parse(response.participant);
  }

  async getParticipantByEmail(email: string): Promise<Participant | null> {
    try {
      const response = await this.request<{ participant: any }>(
        `/api/v2/participants/email/${encodeURIComponent(email)}`
      );
      return ParticipantSchema.parse(response.participant);
    } catch (error) {
      if (error instanceof PerkAPIError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async getParticipantById(id: string): Promise<Participant | null> {
    try {
      const response = await this.request<{ participant: any }>(
        `/api/v2/participants/${id}`
      );
      return ParticipantSchema.parse(response.participant);
    } catch (error) {
      if (error instanceof PerkAPIError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async updateParticipantPoints(
    participantId: string,
    points: number,
    operation: 'add' | 'subtract' | 'set' = 'set'
  ): Promise<Participant> {
    const response = await this.request<{ participant: any }>(
      `/api/v2/participants/points`,
      {
        method: 'PUT',
        body: {
          participant_id: participantId,
          points,
          operation,
        },
      }
    );
    return ParticipantSchema.parse(response.participant);
  }

  async updateParticipant(
    id: string,
    data: {
      profile_attributes?: Record<string, any>;
      tier?: string;
      status?: string;
    }
  ): Promise<Participant> {
    const response = await this.request<{ participant: any }>(
      `/api/v2/participants/${id}`,
      {
        method: 'PUT',
        body: { participant: data },
      }
    );
    return ParticipantSchema.parse(response.participant);
  }

  async updateParticipantProfileAttributes(
    id: string,
    attributes: Record<string, any>
  ): Promise<Participant> {
    const participant = await this.getParticipantById(id);
    if (!participant) {
      throw new PerkAPIError('Participant not found', 404);
    }

    const updatedAttributes = {
      ...participant.profile_attributes,
      ...attributes,
    };

    return this.updateParticipant(id, {
      profile_attributes: updatedAttributes,
    });
  }
}