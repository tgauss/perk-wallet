import { createHmac } from 'crypto';
import { getServerEnv } from './config.server';

const QR_TTL_SECONDS = 180;

export interface QRPayload {
  uuid: string;
  timestamp: number;
  nonce: string;
}

export interface SignedQRPayload extends QRPayload {
  signature: string;
}

export class QRCodeSigner {
  private secret: string;

  constructor(secret?: string) {
    const serverEnv = getServerEnv();
    this.secret = secret || serverEnv.QR_SIGNING_SECRET || 'default-secret';
  }

  private generateNonce(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    for (let i = 0; i < length; i++) {
      nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonce;
  }

  private createSignature(uuid: string, timestamp: number, nonce: string): string {
    const data = `${uuid}|${timestamp}|${nonce}`;
    const hmac = createHmac('sha256', this.secret);
    hmac.update(data);
    return hmac.digest('hex');
  }

  sign(uuid: string): SignedQRPayload {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = this.generateNonce();
    const signature = this.createSignature(uuid, timestamp, nonce);

    return {
      uuid,
      timestamp,
      nonce,
      signature,
    };
  }

  verify(payload: SignedQRPayload): { valid: boolean; uuid?: string; error?: string } {
    try {
      const { uuid, timestamp, nonce, signature } = payload;

      if (!uuid || !timestamp || !nonce || !signature) {
        return { valid: false, error: 'Missing required fields' };
      }

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const age = currentTimestamp - timestamp;

      if (age > QR_TTL_SECONDS) {
        return { valid: false, error: 'QR code expired' };
      }

      if (age < 0) {
        return { valid: false, error: 'Invalid timestamp (future date)' };
      }

      const expectedSignature = this.createSignature(uuid, timestamp, nonce);

      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid signature' };
      }

      return { valid: true, uuid };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Verification failed' 
      };
    }
  }

  encode(payload: SignedQRPayload): string {
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  decode(encoded: string): SignedQRPayload | null {
    try {
      const decoded = Buffer.from(encoded, 'base64url').toString('utf-8');
      return JSON.parse(decoded) as SignedQRPayload;
    } catch {
      return null;
    }
  }

  generateQRData(uuid: string): string {
    const signed = this.sign(uuid);
    return this.encode(signed);
  }

  verifyQRData(qrData: string): { valid: boolean; uuid?: string; error?: string } {
    const payload = this.decode(qrData);
    
    if (!payload) {
      return { valid: false, error: 'Invalid QR data format' };
    }

    return this.verify(payload);
  }
}

export const qrSigner = new QRCodeSigner();