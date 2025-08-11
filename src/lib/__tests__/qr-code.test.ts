import { describe, it, expect, beforeEach } from 'vitest';
import { QRCodeSigner } from '../qr-code';

describe('QRCodeSigner', () => {
  let signer: QRCodeSigner;
  const testSecret = 'test-secret-key';
  const testUuid = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    signer = new QRCodeSigner(testSecret);
  });

  describe('sign', () => {
    it('should generate a signed QR payload', () => {
      const signed = signer.sign(testUuid);
      
      expect(signed).toHaveProperty('uuid', testUuid);
      expect(signed).toHaveProperty('timestamp');
      expect(signed).toHaveProperty('nonce');
      expect(signed).toHaveProperty('signature');
      expect(typeof signed.timestamp).toBe('number');
      expect(typeof signed.nonce).toBe('string');
      expect(typeof signed.signature).toBe('string');
    });

    it('should generate different nonces for multiple signs', () => {
      const signed1 = signer.sign(testUuid);
      const signed2 = signer.sign(testUuid);
      
      expect(signed1.nonce).not.toBe(signed2.nonce);
      expect(signed1.signature).not.toBe(signed2.signature);
    });
  });

  describe('verify', () => {
    it('should verify a valid signed payload', () => {
      const signed = signer.sign(testUuid);
      const result = signer.verify(signed);
      
      expect(result.valid).toBe(true);
      expect(result.uuid).toBe(testUuid);
      expect(result.error).toBeUndefined();
    });

    it('should reject an invalid signature', () => {
      const signed = signer.sign(testUuid);
      signed.signature = 'invalid-signature';
      
      const result = signer.verify(signed);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });

    it('should reject an expired QR code', () => {
      const signed = signer.sign(testUuid);
      signed.timestamp = Math.floor(Date.now() / 1000) - 200;
      
      const result = signer.verify(signed);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('QR code expired');
    });

    it('should reject a future timestamp', () => {
      const signed = signer.sign(testUuid);
      signed.timestamp = Math.floor(Date.now() / 1000) + 100;
      
      const result = signer.verify(signed);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid timestamp (future date)');
    });

    it('should reject missing required fields', () => {
      const invalidPayload: any = {
        uuid: testUuid,
      };
      
      const result = signer.verify(invalidPayload);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing required fields');
    });
  });

  describe('encode/decode', () => {
    it('should encode and decode a payload correctly', () => {
      const signed = signer.sign(testUuid);
      const encoded = signer.encode(signed);
      const decoded = signer.decode(encoded);
      
      expect(decoded).toEqual(signed);
    });

    it('should return null for invalid encoded data', () => {
      const decoded = signer.decode('invalid-base64');
      
      expect(decoded).toBeNull();
    });
  });

  describe('generateQRData/verifyQRData', () => {
    it('should generate and verify QR data', () => {
      const qrData = signer.generateQRData(testUuid);
      const result = signer.verifyQRData(qrData);
      
      expect(result.valid).toBe(true);
      expect(result.uuid).toBe(testUuid);
    });

    it('should reject invalid QR data format', () => {
      const result = signer.verifyQRData('invalid-qr-data');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid QR data format');
    });
  });

  describe('TTL validation', () => {
    it('should accept QR code within TTL window', () => {
      const signed = signer.sign(testUuid);
      signed.timestamp = Math.floor(Date.now() / 1000) - 170;
      
      const result = signer.verify(signed);
      
      expect(result.valid).toBe(true);
    });

    it('should reject QR code outside TTL window', () => {
      const signed = signer.sign(testUuid);
      signed.timestamp = Math.floor(Date.now() / 1000) - 181;
      
      const result = signer.verify(signed);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('QR code expired');
    });
  });
});