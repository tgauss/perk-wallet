import { PKPass } from 'passkit-generator';
import { randomBytes } from 'crypto';
import { config } from './config';
import { qrSigner } from './qr-code';

export interface ApplePassData {
  programId: string;
  perkUuid: string;
  participantName?: string;
  points: number;
  tier?: string;
  passType: 'loyalty' | 'rewards';
  template: any;
  serialNumber?: string;
  authToken?: string;
}

export class ApplePassBuilder {
  private teamIdentifier: string;
  private passTypeIdentifier: string;
  private webServiceURL: string;
  private authTokenSecret: string;

  constructor() {
    this.teamIdentifier = config.APPLE_TEAM_IDENTIFIER;
    this.passTypeIdentifier = config.APPLE_PASS_TYPE_IDENTIFIER;
    this.webServiceURL = config.APPLE_WEB_SERVICE_URL;
    this.authTokenSecret = config.APPLE_AUTH_TOKEN_SECRET;
  }

  private generateSerialNumber(): string {
    return randomBytes(16).toString('hex').toUpperCase();
  }

  private generateAuthToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private createPassStructure(data: ApplePassData): any {
    const qrData = qrSigner.generateQRData(data.perkUuid);
    const serialNumber = data.serialNumber || this.generateSerialNumber();
    const authToken = data.authToken || this.generateAuthToken();

    const basePass = {
      formatVersion: 1,
      passTypeIdentifier: this.passTypeIdentifier,
      serialNumber,
      teamIdentifier: this.teamIdentifier,
      organizationName: 'Perk Wallet',
      description: data.passType === 'loyalty' ? 'Loyalty Card' : 'My Rewards',
      logoText: 'Perk',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(60, 65, 76)',
      labelColor: 'rgb(255, 255, 255)',
      
      groupingIdentifier: String(data.programId),
      
      webServiceURL: this.webServiceURL,
      authenticationToken: authToken,
      
      barcode: {
        format: 'PKBarcodeFormatQR',
        message: qrData,
        messageEncoding: 'iso-8859-1',
      },
      
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: qrData,
          messageEncoding: 'iso-8859-1',
        },
      ],
    };

    if (data.passType === 'loyalty') {
      return {
        ...basePass,
        storeCard: {
          primaryFields: [
            {
              key: 'points',
              label: 'POINTS',
              value: data.points,
            },
          ],
          secondaryFields: [
            {
              key: 'tier',
              label: 'TIER',
              value: data.tier || 'Member',
            },
          ],
          auxiliaryFields: [
            {
              key: 'member',
              label: 'MEMBER',
              value: data.participantName || 'Member',
            },
          ],
          backFields: [
            {
              key: 'terms',
              label: 'Terms and Conditions',
              value: 'Visit perk.studio for full terms and conditions.',
            },
            {
              key: 'uuid',
              label: 'Member ID',
              value: data.perkUuid,
            },
          ],
        },
      };
    } else {
      return {
        ...basePass,
        coupon: {
          primaryFields: [
            {
              key: 'rewards',
              label: 'REWARDS',
              value: `${data.points} Available`,
            },
          ],
          secondaryFields: [
            {
              key: 'status',
              label: 'STATUS',
              value: 'Active',
            },
          ],
          auxiliaryFields: [
            {
              key: 'member',
              label: 'MEMBER',
              value: data.participantName || 'Member',
            },
          ],
          backFields: [
            {
              key: 'instructions',
              label: 'How to Redeem',
              value: 'Show this pass at checkout to redeem your rewards.',
            },
            {
              key: 'uuid',
              label: 'Member ID',
              value: data.perkUuid,
            },
          ],
        },
      };
    }
  }

  async buildPass(data: ApplePassData): Promise<{
    passBuffer: Buffer;
    serialNumber: string;
    authToken: string;
  }> {
    const passStructure = this.createPassStructure(data);
    
    const pass = new PKPass({}, {
      wwdr: process.env.APPLE_WWDR_CERT || '',
      signerCert: process.env.APPLE_SIGNER_CERT || '',
      signerKey: process.env.APPLE_SIGNER_KEY || '',
      signerKeyPassphrase: process.env.APPLE_SIGNER_KEY_PASSPHRASE,
    }, passStructure);

    const passBuffer = await pass.getAsBuffer();

    return {
      passBuffer,
      serialNumber: passStructure.serialNumber,
      authToken: passStructure.authenticationToken,
    };
  }

  async updatePass(
    existingPass: any,
    updates: Partial<ApplePassData>
  ): Promise<Buffer> {
    const updatedData = { ...existingPass, ...updates };
    const { passBuffer } = await this.buildPass(updatedData);
    return passBuffer;
  }

  validateAuthToken(token: string, storedToken: string): boolean {
    return token === storedToken;
  }
}