import { supabase, Database } from './supabase';

type Job = Database['public']['Tables']['jobs']['Row'];
type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type JobStatus = Job['status'];

export interface JobPayload {
  [key: string]: any;
}

export class JobQueue {
  async enqueue(
    type: string,
    payload: JobPayload,
    options: {
      scheduledAt?: Date;
      maxAttempts?: number;
    } = {}
  ): Promise<Job> {
    const jobData: JobInsert = {
      type,
      status: 'pending',
      payload,
      scheduled_at: options.scheduledAt?.toISOString() || new Date().toISOString(),
      max_attempts: options.maxAttempts || 3,
      attempts: 0,
    };

    const { data, error } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to enqueue job: ${error.message}`);
    }

    return data;
  }

  async dequeue(types?: string[]): Promise<Job | null> {
    let query = supabase
      .from('jobs')
      .select()
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1);

    if (types && types.length > 0) {
      query = query.in('type', types);
    }

    const { data: jobs, error } = await query;

    if (error || !jobs || jobs.length === 0) {
      return null;
    }

    const job = jobs[0];

    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'processing' as JobStatus,
        started_at: new Date().toISOString(),
        attempts: job.attempts + 1,
      })
      .eq('id', job.id)
      .eq('status', 'pending');

    if (updateError) {
      return null;
    }

    return {
      ...job,
      status: 'processing' as JobStatus,
      started_at: new Date().toISOString(),
      attempts: job.attempts + 1,
    };
  }

  async complete(jobId: string, result?: any): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'completed' as JobStatus,
        completed_at: new Date().toISOString(),
        result: result || {},
      })
      .eq('id', jobId);

    if (error) {
      throw new Error(`Failed to complete job: ${error.message}`);
    }
  }

  async fail(jobId: string, errorMessage: string): Promise<void> {
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select()
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      throw new Error(`Failed to fetch job: ${fetchError?.message}`);
    }

    const shouldRetry = job.attempts < job.max_attempts;
    const newStatus: JobStatus = shouldRetry ? 'pending' : 'failed';
    
    const nextScheduledAt = shouldRetry
      ? new Date(Date.now() + Math.min(1000 * Math.pow(2, job.attempts), 60000))
      : undefined;

    const { error } = await supabase
      .from('jobs')
      .update({
        status: newStatus,
        error: errorMessage,
        scheduled_at: nextScheduledAt?.toISOString(),
        completed_at: newStatus === 'failed' ? new Date().toISOString() : undefined,
      })
      .eq('id', jobId);

    if (error) {
      throw new Error(`Failed to update job status: ${error.message}`);
    }
  }

  async processJob(
    job: Job,
    handler: (payload: JobPayload) => Promise<any>
  ): Promise<void> {
    try {
      const result = await handler(job.payload);
      await this.complete(job.id, result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.fail(job.id, errorMessage);
      throw error;
    }
  }

  async runWorker(
    handlers: Record<string, (payload: JobPayload) => Promise<any>>,
    options: {
      pollInterval?: number;
      maxConcurrent?: number;
    } = {}
  ): Promise<void> {
    const pollInterval = options.pollInterval || 5000;
    const maxConcurrent = options.maxConcurrent || 1;
    const activeJobs = new Set<string>();

    const processNext = async () => {
      if (activeJobs.size >= maxConcurrent) {
        return;
      }

      const types = Object.keys(handlers);
      const job = await this.dequeue(types);

      if (!job) {
        return;
      }

      activeJobs.add(job.id);

      const handler = handlers[job.type];
      if (!handler) {
        await this.fail(job.id, `No handler for job type: ${job.type}`);
        activeJobs.delete(job.id);
        return;
      }

      this.processJob(job, handler)
        .finally(() => {
          activeJobs.delete(job.id);
        })
        .catch(error => {
          console.error(`Job ${job.id} failed:`, error);
        });
    };

    setInterval(async () => {
      try {
        await processNext();
      } catch (error) {
        console.error('Worker error:', error);
      }
    }, pollInterval);

    await processNext();
  }

  async getJobStatus(jobId: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from('jobs')
      .select()
      .eq('id', jobId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async cancelJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'failed' as JobStatus,
        error: 'Job cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .in('status', ['pending', 'processing']);

    if (error) {
      throw new Error(`Failed to cancel job: ${error.message}`);
    }
  }

  async retryJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'pending' as JobStatus,
        attempts: 0,
        error: null,
        scheduled_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
      })
      .eq('id', jobId)
      .eq('status', 'failed');

    if (error) {
      throw new Error(`Failed to retry job: ${error.message}`);
    }
  }
}

export const jobQueue = new JobQueue();