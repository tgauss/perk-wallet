import { SignJWT } from 'jose';
import { GoogleAuth } from 'google-auth-library';
import { randomBytes } from 'crypto';
import { config } from './config';
import { qrSigner } from './qr-code';

export interface GoogleWalletData {
  programId: string;
  perkUuid: string;
  participantName?: string;
  points: number;
  tier?: string;
  passType: 'loyalty' | 'rewards';
  template: any;
  objectId?: string;
}

export class GoogleWalletBuilder {
  private issuerId: string;
  private serviceAccountEmail: string;
  private serviceAccountKey: any;
  private auth: GoogleAuth;

  constructor() {
    this.issuerId = config.GOOGLE_WALLET_ISSUER_ID;
    this.serviceAccountEmail = config.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
    
    try {
      // Try to parse as direct JSON first, then as base64 encoded JSON
      let keyString = config.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY;
      
      // If it looks like base64, decode it first
      if (!keyString.startsWith('{') && keyString.length > 100) {
        keyString = Buffer.from(keyString, 'base64').toString('utf8');
      }
      
      this.serviceAccountKey = JSON.parse(keyString);
    } catch (error) {
      console.error('Failed to parse Google Wallet service account key:', error);
      // Use dummy key for testing
      this.serviceAccountKey = {
        type: 'service_account',
        private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
        client_email: this.serviceAccountEmail,
      };
    }
    
    this.auth = new GoogleAuth({
      credentials: this.serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    });
  }

  private generateObjectId(): string {
    return `${this.issuerId}.${randomBytes(16).toString('hex')}`;
  }

  private async createLoyaltyClass(programId: string): Promise<any> {
    const classId = `${this.issuerId}.loyalty_${programId}`;
    
    return {
      id: classId,
      issuerId: this.issuerId,
      reviewStatus: 'UNDER_REVIEW',
      programName: 'Perk Loyalty Program',
      programLogo: {
        sourceUri: {
          uri: 'https://pass.perk.ooo/logo.png',
        },
      },
      hexBackgroundColor: '#3C414C',
      heroImage: {
        sourceUri: {
          uri: 'https://pass.perk.ooo/hero.png',
        },
      },
      multipleDevicesAndHoldersAllowedStatus: 'MULTIPLE_HOLDERS',
      callbackOptions: {
        url: `${config.NEXT_PUBLIC_APP_URL}/api/google/callback`,
        updateRequestUrl: `${config.NEXT_PUBLIC_APP_URL}/api/google/update`,
      },
    };
  }

  private async createGenericClass(programId: string): Promise<any> {
    const classId = `${this.issuerId}.rewards_${programId}`;
    
    return {
      id: classId,
      issuerId: this.issuerId,
      reviewStatus: 'UNDER_REVIEW',
      genericType: 'GENERIC_TYPE_UNSPECIFIED',
      title: 'My Rewards',
      hexBackgroundColor: '#3C414C',
      multipleDevicesAndHoldersAllowedStatus: 'MULTIPLE_HOLDERS',
      callbackOptions: {
        url: `${config.NEXT_PUBLIC_APP_URL}/api/google/callback`,
      },
    };
  }

  private createLoyaltyObject(data: GoogleWalletData, classId: string): any {
    const objectId = data.objectId || this.generateObjectId();
    const qrData = qrSigner.generateQRData(data.perkUuid);
    
    return {
      id: objectId,
      classId,
      state: 'ACTIVE',
      accountId: data.perkUuid,
      accountName: data.participantName || 'Member',
      loyaltyPoints: {
        label: 'Points',
        balance: {
          int: data.points,
        },
      },
      secondaryLoyaltyPoints: data.tier ? {
        label: 'Tier',
        balance: {
          string: data.tier,
        },
      } : undefined,
      barcode: {
        type: 'QR_CODE',
        value: qrData,
      },
      textModulesData: [
        {
          header: 'Member ID',
          body: data.perkUuid,
        },
      ],
      groupingInfo: {
        groupingId: String(data.programId),
        sortIndex: data.passType === 'loyalty' ? 1 : 2,
      },
    };
  }

  private createGenericObject(data: GoogleWalletData, classId: string): any {
    const objectId = data.objectId || this.generateObjectId();
    const qrData = qrSigner.generateQRData(data.perkUuid);
    
    return {
      id: objectId,
      classId,
      state: 'ACTIVE',
      header: {
        header: 'My Rewards',
        defaultValue: {
          language: 'en',
          value: 'My Rewards',
        },
      },
      barcode: {
        type: 'QR_CODE',
        value: qrData,
      },
      cardTitle: {
        defaultValue: {
          language: 'en',
          value: `${data.points} Rewards Available`,
        },
      },
      subheader: {
        defaultValue: {
          language: 'en',
          value: 'Active',
        },
      },
      textModulesData: [
        {
          header: 'Member',
          body: data.participantName || 'Member',
        },
        {
          header: 'Member ID',
          body: data.perkUuid,
        },
      ],
      groupingInfo: {
        groupingId: String(data.programId),
        sortIndex: 2,
      },
    };
  }

  async buildPass(data: GoogleWalletData): Promise<{
    jwt: string;
    saveUrl: string;
    objectId: string;
  }> {
    const classId = data.passType === 'loyalty' 
      ? `${this.issuerId}.loyalty_${data.programId}`
      : `${this.issuerId}.rewards_${data.programId}`;
    
    const classObject = data.passType === 'loyalty'
      ? await this.createLoyaltyClass(data.programId)
      : await this.createGenericClass(data.programId);
    
    const passObject = data.passType === 'loyalty'
      ? this.createLoyaltyObject(data, classId)
      : this.createGenericObject(data, classId);

    const payload = data.passType === 'loyalty' ? {
      loyaltyClasses: [classObject],
      loyaltyObjects: [passObject],
    } : {
      genericClasses: [classObject],
      genericObjects: [passObject],
    };

    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      Buffer.from(this.serviceAccountKey.private_key.replace(/-----BEGIN PRIVATE KEY-----|\n|-----END PRIVATE KEY-----/g, ''), 'base64'),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuer(this.serviceAccountEmail)
      .setAudience('google')
      .setSubject(this.serviceAccountEmail)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);

    const saveUrl = `https://pay.google.com/gp/v/save/${jwt}`;

    return {
      jwt,
      saveUrl,
      objectId: passObject.id,
    };
  }

  async buildMultiPass(loyaltyData: GoogleWalletData, rewardsData: GoogleWalletData): Promise<{
    jwt: string;
    saveUrl: string;
    loyaltyObjectId: string;
    rewardsObjectId: string;
  }> {
    const loyaltyClassId = `${this.issuerId}.loyalty_${loyaltyData.programId}`;
    const rewardsClassId = `${this.issuerId}.rewards_${rewardsData.programId}`;
    
    const loyaltyClass = await this.createLoyaltyClass(loyaltyData.programId);
    const rewardsClass = await this.createGenericClass(rewardsData.programId);
    
    const loyaltyObject = this.createLoyaltyObject(loyaltyData, loyaltyClassId);
    const rewardsObject = this.createGenericObject(rewardsData, rewardsClassId);

    const payload = {
      loyaltyClasses: [loyaltyClass],
      loyaltyObjects: [loyaltyObject],
      genericClasses: [rewardsClass],
      genericObjects: [rewardsObject],
    };

    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      Buffer.from(this.serviceAccountKey.private_key.replace(/-----BEGIN PRIVATE KEY-----|\n|-----END PRIVATE KEY-----/g, ''), 'base64'),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuer(this.serviceAccountEmail)
      .setAudience('google')
      .setSubject(this.serviceAccountEmail)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);

    const saveUrl = `https://pay.google.com/gp/v/save/${jwt}`;

    return {
      jwt,
      saveUrl,
      loyaltyObjectId: loyaltyObject.id,
      rewardsObjectId: rewardsObject.id,
    };
  }

  async updatePass(objectId: string, updates: Partial<GoogleWalletData>): Promise<void> {
    const client = await this.auth.getClient();
    const url = `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId}`;
    
    const updatePayload: any = {};
    
    if (updates.points !== undefined) {
      updatePayload.loyaltyPoints = {
        label: 'Points',
        balance: {
          int: updates.points,
        },
      };
    }
    
    if (updates.tier !== undefined) {
      updatePayload.secondaryLoyaltyPoints = {
        label: 'Tier',
        balance: {
          string: updates.tier,
        },
      };
    }

    await client.request({
      url,
      method: 'PATCH',
      data: updatePayload,
    });
  }
}