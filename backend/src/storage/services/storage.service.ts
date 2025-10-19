import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { IStorageConfiguration } from '../../configuration/storage';

function getSasQueryFromUrl(url: string): string {
    const idx = url.indexOf('?');
    return idx >= 0 ? url.substring(idx + 1) : '';
  }

@Injectable()
export class StorageService {
    private readonly blobService: BlobServiceClient | null;
  private readonly blobEndpoint: string;
  private readonly sasQuery: string;

  constructor(private readonly configService: ConfigService) {
    console.log('[StorageService] Constructor called');
    const storageConfig = this.configService.get<IStorageConfiguration>('storage');
    const isDevelopment = this.configService.get('app.nodeEnv') === 'development';
    
    console.log('[StorageService] Storage config:', {
      sasBlobObjectsUrl: storageConfig?.sasBlobObjectsUrl ? 'SET' : 'NOT SET',
      isDevelopment
    });
    
    if (!storageConfig?.sasBlobObjectsUrl || storageConfig.sasBlobObjectsUrl.trim() === '') {
      if (isDevelopment) {
        console.warn('Azure Storage not configured, using mock mode for development');
        this.blobService = null;
        this.blobEndpoint = 'http://localhost:3003/mock-storage';
        this.sasQuery = '';
        return;
      }
      throw new Error('AZURE_STORAGE_SAS_BLOB_OBJECTS_URL not configured');
    }

    try {
      console.log('[StorageService] Creating BlobServiceClient from SAS URL');
      this.blobService = new BlobServiceClient(storageConfig.sasBlobObjectsUrl);
      const url = new URL(storageConfig.sasBlobObjectsUrl);
      this.blobEndpoint = `${url.protocol}//${url.host}`;
      this.sasQuery = getSasQueryFromUrl(storageConfig.sasBlobObjectsUrl);
      
      console.log('[StorageService] Azure Storage initialized successfully:', {
        blobEndpoint: this.blobEndpoint,
        sasQueryLength: this.sasQuery.length
      });
    } catch (error) {
      if (isDevelopment) {
        console.warn('Failed to create Azure Storage client, using mock mode:', error.message);
        this.blobService = null;
        this.blobEndpoint = 'http://localhost:3003/mock-storage';
        this.sasQuery = '';
        return;
      }
      throw new Error(`Failed to create Azure Storage client: ${error.message}`);
    }
  }

  async listContainers(): Promise<string[]> {
    if (!this.blobService) {
      return ['test-container-1', 'test-container-2'];
    }

    try {
      const names: string[] = [];
      for await (const c of this.blobService.listContainers()) {
        names.push(c.name);
      }
      return names;
    } catch (error) {
      console.error('Error listing containers:', error);
      throw new Error(`Failed to list containers: ${error.message}`);
    }
  }

  getContainerClient(container: string): ContainerClient {
    if (!this.blobService) {
      throw new Error('Azure Storage not available in mock mode');
    }
    return this.blobService.getContainerClient(container);
  }

  async listBlobs(container: string): Promise<{ name: string; size?: number; contentType?: string; url: string }[]> {
    console.log(`[StorageService] listBlobs called for container: ${container}`);
    console.log(`[StorageService] blobService available: ${!!this.blobService}`);
    
    if (!this.blobService) {
      console.log('[StorageService] Using mock mode');
      return [
        {
          name: 'test-file-1.txt',
          size: 1024,
          contentType: 'text/plain',
          url: `${this.blobEndpoint}/${container}/test-file-1.txt?${this.sasQuery}`
        }
      ];
    }

    try {
      console.log(`[StorageService] Getting container client for: ${container}`);
      const client = this.getContainerClient(container);
      console.log(`[StorageService] Container client obtained successfully`);
      
      const out: { name: string; size?: number; contentType?: string; url: string }[] = [];
      let blobCount = 0;

      console.log(`[StorageService] Starting to list blobs...`);
      for await (const item of client.listBlobsFlat({ includeMetadata: false, includeTags: false, includeVersions: false })) {
        blobCount++;
        console.log(`[StorageService] Found blob: ${item.name}, size: ${item.properties.contentLength}`);
        
        const url = `${this.blobEndpoint}/${encodeURIComponent(container)}/${encodeURIComponent(item.name)}?${this.sasQuery}`;
        out.push({
          name: item.name,
          size: item.properties.contentLength,
          contentType: item.properties.contentType,
          url,
        });
      }
      
      console.log(`[StorageService] Total blobs found: ${blobCount}`);
      console.log(`[StorageService] Returning ${out.length} blobs`);
      return out;
    } catch (error) {
      console.error('[StorageService] Error listing blobs:', error);
      throw new Error(`Failed to list blobs in container ${container}: ${error.message}`);
    }
  }

  async downloadToBuffer(container: string, blobName: string): Promise<Buffer> {
    if (!this.blobService) {
      return Buffer.from('This is a mock file content for development');
    }

    try {
      const client = this.getContainerClient(container).getBlobClient(blobName);
      const res = await client.download();
      const chunks: Buffer[] = [];
      for await (const chunk of res.readableStreamBody as any as AsyncIterable<Buffer>) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error downloading blob:', error);
      throw new Error(`Failed to download blob ${blobName} from container ${container}: ${error.message}`);
    }
  }

  getBlobUrl(container: string, blobName: string): string {
    return `${this.blobEndpoint}/${encodeURIComponent(container)}/${encodeURIComponent(blobName)}?${this.sasQuery}`;
  }
}
