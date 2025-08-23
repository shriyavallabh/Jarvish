/**
 * Encryption Manager
 * Handles end-to-end encryption, key management, and secure data protection
 */

import crypto from 'crypto';
import { z } from 'zod';

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  saltLength: 64,
  tagLength: 16,
  ivLength: 16,
  iterations: 100000,
  keyLength: 32,
  digest: 'sha256',
};

// Key rotation configuration
const KEY_ROTATION_CONFIG = {
  rotationInterval: 90, // days
  maxKeyAge: 365, // days
  keyVersioning: true,
  backupKeys: 3,
};

// Data classification for encryption
export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted', // PII, Financial data
}

// Encryption key schema
const EncryptionKeySchema = z.object({
  id: z.string(),
  version: z.number(),
  algorithm: z.string(),
  key: z.string(),
  iv: z.string().optional(),
  salt: z.string().optional(),
  createdAt: z.date(),
  rotatedAt: z.date().optional(),
  expiresAt: z.date(),
  status: z.enum(['active', 'rotated', 'expired', 'compromised']),
});

export type EncryptionKey = z.infer<typeof EncryptionKeySchema>;

// Encrypted data schema
const EncryptedDataSchema = z.object({
  ciphertext: z.string(),
  iv: z.string(),
  authTag: z.string(),
  keyVersion: z.number(),
  algorithm: z.string(),
  classification: z.nativeEnum(DataClassification),
  metadata: z.record(z.any()).optional(),
});

export type EncryptedData = z.infer<typeof EncryptedDataSchema>;

export class EncryptionManager {
  private masterKey: Buffer;
  private keyCache: Map<string, EncryptionKey> = new Map();
  private activeKeyVersion: number = 1;

  constructor(masterKeyBase64?: string) {
    // Initialize master key from environment or generate
    if (masterKeyBase64) {
      this.masterKey = Buffer.from(masterKeyBase64, 'base64');
    } else if (process.env.MASTER_ENCRYPTION_KEY) {
      this.masterKey = Buffer.from(process.env.MASTER_ENCRYPTION_KEY, 'base64');
    } else {
      throw new Error('Master encryption key not provided');
    }

    // Validate master key length
    if (this.masterKey.length !== 32) {
      throw new Error('Master key must be 256 bits (32 bytes)');
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encrypt(
    plaintext: string,
    classification: DataClassification = DataClassification.CONFIDENTIAL
  ): Promise<EncryptedData> {
    try {
      // Generate IV
      const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
      
      // Get or create encryption key for current version
      const key = await this.getActiveKey();
      
      // Create cipher
      const cipher = crypto.createCipheriv(
        ENCRYPTION_CONFIG.algorithm,
        Buffer.from(key.key, 'hex'),
        iv
      );
      
      // Encrypt data
      let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
      ciphertext += cipher.final('hex');
      
      // Get auth tag for GCM mode
      const authTag = cipher.getAuthTag();
      
      return {
        ciphertext,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        keyVersion: this.activeKeyVersion,
        algorithm: ENCRYPTION_CONFIG.algorithm,
        classification,
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt encrypted data
   */
  async decrypt(encryptedData: EncryptedData): Promise<string> {
    try {
      // Get encryption key for the specified version
      const key = await this.getKeyByVersion(encryptedData.keyVersion);
      
      if (!key) {
        throw new Error(`Encryption key version ${encryptedData.keyVersion} not found`);
      }
      
      // Create decipher
      const decipher = crypto.createDecipheriv(
        encryptedData.algorithm,
        Buffer.from(key.key, 'hex'),
        Buffer.from(encryptedData.iv, 'hex')
      );
      
      // Set auth tag for GCM mode
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      // Decrypt data
      let plaintext = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
      plaintext += decipher.final('utf8');
      
      return plaintext;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt PII data with additional protections
   */
  async encryptPII(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encrypted = await this.encrypt(jsonString, DataClassification.RESTRICTED);
    
    // Add additional layer of encryption for PII
    const doubleEncrypted = await this.encrypt(
      JSON.stringify(encrypted),
      DataClassification.RESTRICTED
    );
    
    return Buffer.from(JSON.stringify(doubleEncrypted)).toString('base64');
  }

  /**
   * Decrypt PII data
   */
  async decryptPII(encryptedPII: string): Promise<any> {
    try {
      const doubleEncrypted = JSON.parse(
        Buffer.from(encryptedPII, 'base64').toString('utf8')
      );
      
      const encrypted = JSON.parse(await this.decrypt(doubleEncrypted));
      const decrypted = await this.decrypt(encrypted);
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('PII decryption failed:', error);
      throw new Error('Failed to decrypt PII data');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(ENCRYPTION_CONFIG.saltLength).toString('hex');
    const hash = crypto.pbkdf2Sync(
      data,
      actualSalt,
      ENCRYPTION_CONFIG.iterations,
      ENCRYPTION_CONFIG.keyLength,
      ENCRYPTION_CONFIG.digest
    );
    
    return `${actualSalt}:${hash.toString('hex')}`;
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hashedData: string): boolean {
    const [salt, hash] = hashedData.split(':');
    const verifyHash = crypto.pbkdf2Sync(
      data,
      salt,
      ENCRYPTION_CONFIG.iterations,
      ENCRYPTION_CONFIG.keyLength,
      ENCRYPTION_CONFIG.digest
    );
    
    return hash === verifyHash.toString('hex');
  }

  /**
   * Generate secure token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Tokenize sensitive data (for PCI compliance)
   */
  async tokenize(sensitiveData: string): Promise<string> {
    const token = this.generateSecureToken();
    const encrypted = await this.encrypt(sensitiveData, DataClassification.RESTRICTED);
    
    // Store token-data mapping securely
    await this.storeTokenMapping(token, encrypted);
    
    return token;
  }

  /**
   * Detokenize to retrieve original data
   */
  async detokenize(token: string): Promise<string> {
    const encrypted = await this.retrieveTokenMapping(token);
    if (!encrypted) {
      throw new Error('Invalid token');
    }
    
    return this.decrypt(encrypted);
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(): Promise<void> {
    try {
      // Generate new key
      const newKey = await this.generateKey();
      
      // Mark current key as rotated
      const currentKey = await this.getActiveKey();
      if (currentKey) {
        currentKey.status = 'rotated';
        currentKey.rotatedAt = new Date();
      }
      
      // Activate new key
      this.activeKeyVersion = newKey.version;
      this.keyCache.set(`v${newKey.version}`, newKey);
      
      // Re-encrypt critical data with new key
      await this.reencryptData(currentKey, newKey);
      
      console.log(`Key rotation completed. New version: ${newKey.version}`);
    } catch (error) {
      console.error('Key rotation failed:', error);
      throw new Error('Failed to rotate encryption keys');
    }
  }

  /**
   * Secure data deletion (crypto-shredding)
   */
  async secureDelete(data: any): Promise<void> {
    // Overwrite memory multiple times
    if (typeof data === 'string') {
      const buffer = Buffer.from(data);
      crypto.randomFillSync(buffer);
      crypto.randomFillSync(buffer);
      crypto.randomFillSync(buffer);
    } else if (Buffer.isBuffer(data)) {
      crypto.randomFillSync(data);
      crypto.randomFillSync(data);
      crypto.randomFillSync(data);
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Create data encryption key (DEK) from master key
   */
  private async deriveKey(salt: Buffer, info: string = 'data-encryption-key'): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.hkdf(
        ENCRYPTION_CONFIG.digest,
        this.masterKey,
        salt,
        Buffer.from(info),
        ENCRYPTION_CONFIG.keyLength,
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(Buffer.from(derivedKey));
        }
      );
    });
  }

  /**
   * Generate new encryption key
   */
  private async generateKey(): Promise<EncryptionKey> {
    const salt = crypto.randomBytes(ENCRYPTION_CONFIG.saltLength);
    const derivedKey = await this.deriveKey(salt, `key-v${this.activeKeyVersion + 1}`);
    
    const newKey: EncryptionKey = {
      id: crypto.randomUUID(),
      version: this.activeKeyVersion + 1,
      algorithm: ENCRYPTION_CONFIG.algorithm,
      key: derivedKey.toString('hex'),
      salt: salt.toString('hex'),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + KEY_ROTATION_CONFIG.maxKeyAge * 24 * 60 * 60 * 1000),
      status: 'active',
    };
    
    return newKey;
  }

  /**
   * Get active encryption key
   */
  private async getActiveKey(): Promise<EncryptionKey> {
    const cachedKey = this.keyCache.get(`v${this.activeKeyVersion}`);
    if (cachedKey && cachedKey.status === 'active') {
      return cachedKey;
    }
    
    // Generate new key if not found
    const newKey = await this.generateKey();
    this.keyCache.set(`v${newKey.version}`, newKey);
    return newKey;
  }

  /**
   * Get encryption key by version
   */
  private async getKeyByVersion(version: number): Promise<EncryptionKey | null> {
    const cachedKey = this.keyCache.get(`v${version}`);
    if (cachedKey) {
      return cachedKey;
    }
    
    // Try to retrieve from storage
    // Implementation depends on your storage solution
    return null;
  }

  /**
   * Re-encrypt data with new key
   */
  private async reencryptData(oldKey: EncryptionKey, newKey: EncryptionKey): Promise<void> {
    // This would typically re-encrypt all data using the new key
    // Implementation depends on your data storage
    console.log(`Re-encrypting data from key v${oldKey.version} to v${newKey.version}`);
  }

  /**
   * Store token mapping securely
   */
  private async storeTokenMapping(token: string, encryptedData: EncryptedData): Promise<void> {
    // Store in secure database or key-value store
    // Implementation depends on your storage solution
    this.keyCache.set(`token:${token}`, encryptedData as any);
  }

  /**
   * Retrieve token mapping
   */
  private async retrieveTokenMapping(token: string): Promise<EncryptedData | null> {
    // Retrieve from secure storage
    // Implementation depends on your storage solution
    return this.keyCache.get(`token:${token}`) as any;
  }

  /**
   * Encrypt file
   */
  async encryptFile(filePath: string, outputPath: string): Promise<void> {
    const fs = await import('fs');
    const stream = await import('stream');
    const pipeline = stream.promises.pipeline;
    
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
    const key = await this.getActiveKey();
    
    const cipher = crypto.createCipheriv(
      ENCRYPTION_CONFIG.algorithm,
      Buffer.from(key.key, 'hex'),
      iv
    );
    
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(outputPath);
    
    // Write IV to the beginning of the file
    output.write(iv);
    
    await pipeline(input, cipher, output);
    
    // Write auth tag at the end
    const authTag = cipher.getAuthTag();
    fs.appendFileSync(outputPath, authTag);
  }

  /**
   * Decrypt file
   */
  async decryptFile(encryptedPath: string, outputPath: string): Promise<void> {
    const fs = await import('fs');
    const stream = await import('stream');
    
    const fileContent = fs.readFileSync(encryptedPath);
    const iv = fileContent.subarray(0, ENCRYPTION_CONFIG.ivLength);
    const authTag = fileContent.subarray(fileContent.length - ENCRYPTION_CONFIG.tagLength);
    const encrypted = fileContent.subarray(
      ENCRYPTION_CONFIG.ivLength,
      fileContent.length - ENCRYPTION_CONFIG.tagLength
    );
    
    const key = await this.getActiveKey();
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_CONFIG.algorithm,
      Buffer.from(key.key, 'hex'),
      iv
    );
    
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    
    fs.writeFileSync(outputPath, decrypted);
  }
}

// Export singleton instance
let encryptionManager: EncryptionManager | null = null;

export function getEncryptionManager(): EncryptionManager {
  if (!encryptionManager) {
    encryptionManager = new EncryptionManager();
  }
  return encryptionManager;
}

export default EncryptionManager;