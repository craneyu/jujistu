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

  /**
   * 下載 blob 內容。容器維持私有，因此由應用程式讀取後再串流給瀏覽器，
   * 而不是把 blob 網址直接交出去（見 src/app/api/files/[filename]/route.ts）。
   * 找不到檔案時回傳 null，其餘錯誤往外拋。
   */
  async downloadFile(
    fileName: string
  ): Promise<{ buffer: Buffer; contentType?: string } | null> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    try {
      const buffer = await blockBlobClient.downloadToBuffer();
      const properties = await blockBlobClient.getProperties();
      return { buffer, contentType: properties.contentType };
    } catch (error) {
      const statusCode = (error as { statusCode?: number })?.statusCode;
      if (statusCode === 404) return null;
      throw error;
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
