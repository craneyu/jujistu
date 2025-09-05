import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

interface UploadResult {
  success: boolean;
  fileName?: string;
  url?: string;
  error?: string;
}

class AzureBlobStorage {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor() {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

    if (!accountName) {
      throw new Error(
        "AZURE_STORAGE_ACCOUNT_NAME environment variable is required"
      );
    }

    // 在 Azure 環境中使用 Managed Identity
    const credential = new DefaultAzureCredential();
    const blobServiceUrl = `https://${accountName}.blob.core.windows.net`;

    this.blobServiceClient = new BlobServiceClient(blobServiceUrl, credential);
    this.containerName = containerName;
  }

  async uploadFile(file: File, fileName: string): Promise<UploadResult> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName
      );
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: file.type,
        },
      });

      const url = blockBlobClient.url;

      return {
        success: true,
        fileName,
        url,
      };
    } catch (error) {
      console.error("Azure Blob Storage upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteFile(fileName: string): Promise<boolean> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName
      );
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      await blockBlobClient.delete();
      return true;
    } catch (error) {
      console.error("Azure Blob Storage delete error:", error);
      return false;
    }
  }

  async getFileUrl(fileName: string): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    return blockBlobClient.url;
  }
}

// 單例模式
let azureBlobStorage: AzureBlobStorage | null = null;

export function getAzureBlobStorage(): AzureBlobStorage {
  if (!azureBlobStorage) {
    azureBlobStorage = new AzureBlobStorage();
  }
  return azureBlobStorage;
}

export default AzureBlobStorage;
