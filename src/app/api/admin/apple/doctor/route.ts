import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import forge from 'node-forge';
import { PKPass } from 'passkit-generator';
import { existsSync } from 'fs';
import { join } from 'path';

export type DoctorStatus = 'ok' | 'warn' | 'fail';

export interface DoctorItem {
  name: string;
  status: DoctorStatus;
  details: string;
}

export interface AppleDoctorResponse {
  sections: {
    env: DoctorItem[];
    certificate: DoctorItem[];
    signing: DoctorItem[];
    routes: DoctorItem[];
  };
  timestamp: string;
}

function createItem(name: string, status: DoctorStatus, details: string): DoctorItem {
  return { name, status, details };
}

async function checkEnvVars(): Promise<DoctorItem[]> {
  const items: DoctorItem[] = [];
  
  const envVars = [
    'APPLE_PASS_TYPE_IDENTIFIER',
    'APPLE_TEAM_IDENTIFIER', 
    'APPLE_WEB_SERVICE_URL',
    'APPLE_AUTH_TOKEN_SECRET',
    'APPLE_PASS_CERT_P12_BASE64',
    'APPLE_PASS_CERT_PASSWORD'
  ];
  
  for (const varName of envVars) {
    const value = process.env[varName];
    if (value) {
      items.push(createItem(varName, 'ok', 'Present'));
    } else {
      items.push(createItem(varName, 'fail', 'Missing'));
    }
  }
  
  return items;
}

async function checkCertificate(): Promise<DoctorItem[]> {
  const items: DoctorItem[] = [];
  
  try {
    const certBase64 = process.env.APPLE_PASS_CERT_P12_BASE64;
    const certPassword = process.env.APPLE_PASS_CERT_PASSWORD;
    const passTypeId = process.env.APPLE_PASS_TYPE_IDENTIFIER;
    const teamId = process.env.APPLE_TEAM_IDENTIFIER;
    
    if (!certBase64) {
      items.push(createItem('Certificate Data', 'fail', 'APPLE_PASS_CERT_P12_BASE64 not set'));
      return items;
    }
    
    if (!certPassword) {
      items.push(createItem('Certificate Password', 'fail', 'APPLE_PASS_CERT_PASSWORD not set'));
      return items;
    }
    
    // Decode base64 to buffer
    const p12Buffer = Buffer.from(certBase64, 'base64');
    items.push(createItem('Certificate Size', 'ok', `${p12Buffer.length} bytes`));
    
    // Parse P12 with node-forge
    const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certPassword);
    
    // Extract certificate bags
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag];
    
    if (!certBag || certBag.length === 0) {
      items.push(createItem('Certificate Bags', 'fail', 'No certificates found in P12'));
      return items;
    }
    
    // Get the first certificate
    const cert = certBag[0].cert;
    if (!cert) {
      items.push(createItem('Certificate', 'fail', 'Could not extract certificate'));
      return items;
    }
    
    // Extract subject details
    const subject = cert.subject.attributes;
    const issuer = cert.issuer.attributes;
    
    let cn = '';
    let ou = '';
    
    for (const attr of subject) {
      if (attr.name === 'commonName') {
        cn = attr.value as string;
      }
      if (attr.name === 'organizationalUnitName') {
        ou = attr.value as string;
      }
    }
    
    items.push(createItem('Certificate CN', 'ok', cn || 'Not found'));
    items.push(createItem('Certificate OU', 'ok', ou || 'Not found'));
    
    // Check if CN contains Pass Type ID
    if (passTypeId && cn) {
      if (cn.includes(passTypeId)) {
        items.push(createItem('Pass Type ID Match', 'ok', `CN contains ${passTypeId}`));
      } else {
        items.push(createItem('Pass Type ID Match', 'fail', 
          `CN mismatch. Expected Pass Type ID: ${passTypeId}. Check you exported the Pass Type ID cert with private key.`));
      }
    }
    
    // Check if OU matches Team ID
    if (teamId && ou) {
      if (ou === teamId) {
        items.push(createItem('Team ID Match', 'ok', `OU matches ${teamId}`));
      } else {
        items.push(createItem('Team ID Match', 'fail',
          `OU mismatch. Expected Team ID: ${teamId}. Verify team identifier.`));
      }
    }
    
    // Get issuer CN
    let issuerCn = '';
    for (const attr of issuer) {
      if (attr.name === 'commonName') {
        issuerCn = attr.value as string;
      }
    }
    items.push(createItem('Issuer', 'ok', issuerCn || 'Unknown'));
    
    // Calculate SHA-1 fingerprint
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const sha1 = createHash('sha1');
    sha1.update(Buffer.from(certDer, 'binary'));
    const fingerprint = sha1.digest('hex').toUpperCase().match(/.{2}/g)?.join(':') || '';
    items.push(createItem('SHA-1 Fingerprint', 'ok', fingerprint));
    
    // Check expiry
    const now = new Date();
    const notBefore = cert.validity.notBefore;
    const notAfter = cert.validity.notAfter;
    
    if (now < notBefore) {
      items.push(createItem('Certificate Validity', 'fail', `Not yet valid (starts ${notBefore.toISOString()})`));
    } else if (now > notAfter) {
      items.push(createItem('Certificate Validity', 'fail', `Expired (ended ${notAfter.toISOString()})`));
    } else {
      const daysLeft = Math.floor((notAfter.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      items.push(createItem('Certificate Validity', daysLeft < 30 ? 'warn' : 'ok', 
        `Valid until ${notAfter.toISOString().split('T')[0]} (${daysLeft} days left)`));
    }
    
  } catch (error) {
    items.push(createItem('Certificate Parse', 'fail', 
      error instanceof Error ? error.message : 'Unknown error'));
  }
  
  return items;
}

async function checkSigning(): Promise<DoctorItem[]> {
  const items: DoctorItem[] = [];
  
  try {
    const certBase64 = process.env.APPLE_PASS_CERT_P12_BASE64;
    const certPassword = process.env.APPLE_PASS_CERT_PASSWORD;
    const passTypeId = process.env.APPLE_PASS_TYPE_IDENTIFIER;
    const teamId = process.env.APPLE_TEAM_IDENTIFIER;
    
    if (!certBase64 || !certPassword || !passTypeId || !teamId) {
      items.push(createItem('Dry Run', 'fail', 'Missing required environment variables'));
      return items;
    }
    
    // Generate test serial number
    const serialNumber = 'TEST-' + randomBytes(8).toString('hex').toUpperCase();
    
    // Create minimal pass.json
    const passJson: any = {
      formatVersion: 1,
      passTypeIdentifier: passTypeId,
      serialNumber: serialNumber,
      teamIdentifier: teamId,
      organizationName: 'Perk Wallet Dev',
      description: 'Doctor smoke test',
      barcodes: [{
        format: 'PKBarcodeFormatQR',
        message: 'TEST-APPLE',
        messageEncoding: 'iso-8859-1'
      }],
      backgroundColor: 'rgb(20, 20, 20)',
      foregroundColor: 'rgb(255, 255, 255)',
      generic: {
        primaryFields: [{
          key: 'test',
          label: 'TEST',
          value: 'Doctor Check'
        }]
      }
    };
    
    items.push(createItem('Pass Serial', 'ok', serialNumber));
    
    // Create minimal 1x1 PNG buffers
    const icon = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    const logo = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    // Try to create a PKPass - passkit-generator v3 style
    const pass = new PKPass({
      'icon.png': icon,
      'icon@2x.png': icon,
      'logo.png': logo,
      'logo@2x.png': logo
    }, {
      wwdr: '', // Skip WWDR for test
      signerCert: certBase64,
      signerKey: certBase64,
      signerKeyPassphrase: certPassword
    }, passJson);
    
    // Generate the pass buffer
    const passBuffer = await pass.getAsBuffer();
    
    if (!passBuffer || passBuffer.length === 0) {
      items.push(createItem('Pass Generation', 'fail', 'Failed to generate pass buffer'));
      return items;
    }
    
    items.push(createItem('Pass Size', 'ok', `${passBuffer.length} bytes`));
    
    // Calculate SHA-256 of the generated pass
    const sha256 = createHash('sha256');
    sha256.update(passBuffer);
    const passHash = sha256.digest('hex');
    items.push(createItem('Pass SHA-256', 'ok', passHash.substring(0, 16) + '...'));
    
    items.push(createItem('Signing Status', 'ok', 'Successfully signed test pass'));
    
  } catch (error) {
    items.push(createItem('Signing Test', 'fail', 
      error instanceof Error ? error.message : 'Unknown error'));
  }
  
  return items;
}

async function checkRoutes(): Promise<DoctorItem[]> {
  const items: DoctorItem[] = [];
  
  // Check for Apple web service routes
  const routesToCheck = [
    {
      path: 'src/app/api/apple-web-service/v1/devices/[deviceLibraryIdentifier]/registrations/[passTypeIdentifier]/[serialNumber]/route.ts',
      name: 'Apple Web Service (device registration)'
    },
    {
      path: 'src/app/api/apple-web-service/v1/passes/[passTypeIdentifier]/[serialNumber]/route.ts',
      name: 'Apple Web Service (pass info)'
    },
    {
      path: 'src/app/api/apple-web-service/v1/log/route.ts',
      name: 'Apple Web Service (log)'
    }
  ];
  
  let foundRoutes = 0;
  for (const route of routesToCheck) {
    const fullPath = join(process.cwd(), route.path);
    if (existsSync(fullPath)) {
      foundRoutes++;
    }
  }
  
  if (foundRoutes === 3) {
    items.push(createItem('Apple Web Service', 'ok', 'All 3 Apple web service routes found'));
  } else if (foundRoutes > 0) {
    items.push(createItem('Apple Web Service', 'warn', `${foundRoutes}/3 Apple web service routes found`));
  } else {
    items.push(createItem('Apple Web Service', 'fail', 'No Apple web service routes found'));
  }
  
  // Check for pass generation routes
  const passRoute = join(process.cwd(), 'src/app/api/passes/issue/route.ts');
  if (existsSync(passRoute)) {
    items.push(createItem('Pass Issue Route', 'ok', 'Found at /api/passes/issue'));
  } else {
    items.push(createItem('Pass Issue Route', 'fail', 'Missing pass issue route'));
  }
  
  return items;
}

export async function GET(request: NextRequest) {
  // Check if we have emulator secret for dev-only features
  const hasEmulatorSecret = !!process.env.APP_EMULATOR_SECRET;
  
  if (!hasEmulatorSecret) {
    return NextResponse.json(
      { error: 'APP_EMULATOR_SECRET required for admin features' },
      { status: 403 }
    );
  }
  
  const [envItems, certItems, signingItems, routeItems] = await Promise.all([
    checkEnvVars(),
    checkCertificate(),
    checkSigning(),
    checkRoutes()
  ]);
  
  const response: AppleDoctorResponse = {
    sections: {
      env: envItems,
      certificate: certItems,
      signing: signingItems,
      routes: routeItems
    },
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(response);
}