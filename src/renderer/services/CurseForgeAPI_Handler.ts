import { downloadService } from '../services/downloadService';

export interface CurseForgeMod {
  id: number;
  gameId: number;
  name: string;
  slug: string;
  links: {
    websiteUrl: string;
    wikiUrl?: string;
    issuesUrl?: string;
    sourceUrl?: string;
  };
  summary: string;
  status: number;
  downloadCount: number;
  isFeatured: boolean;
  primaryCategoryId: number;
  categories: CurseForgeCategory[];
  classId: number;
  authors: Array<{
    id: number;
    name: string;
    url: string;
  }>;
  logo: {
    id: number;
    modId: number;
    title: string;
    description: string;
    thumbnailUrl: string;
    url: string;
  };
  screenshots: Array<{
    id: number;
    modId: number;
    title: string;
    description: string;
    thumbnailUrl: string;
    url: string;
  }>;
  mainFileId: number;
  latestFiles: CurseForgeFile[];
  latestFilesIndexes: Array<{
    gameVersion: string;
    fileId: number;
    filename: string;
    releaseType: number;
    gameVersionTypeId?: number;
  }>;
  dateCreated: string;
  dateModified: string;
  dateReleased: string;
  allowModDistribution: boolean;
  gamePopularityRank: number;
  isAvailable: boolean;
  thumbsUpCount: number;
}

export interface CurseForgeCategory {
  id: number;
  gameId: number;
  name: string;
  slug: string;
  url: string;
  icon: string;
  dateModified: string;
  isClass: boolean;
  classId: number;
  parentCategoryId: number;
  displayIndex: number;
}

export interface CurseForgeFile {
  id: number;
  gameId: number;
  modId: number;
  isAvailable: boolean;
  displayName: string;
  fileName: string;
  releaseType: number; // 1 = Release, 2 = Beta, 3 = Alpha
  fileStatus: number;
  hashes: Array<{
    value: string;
    algo: number; // 1 = MD5, 2 = SHA1
  }>;
  fileDate: string;
  fileLength: number;
  downloadCount: number;
  fileSizeOnDisk?: number;
  fileSources: Array<{
    sourceType: number;
    sourceFileId: number;
  }>;
  fileDependencies: Array<{
    modId: number;
    mandatory: boolean;
    type: number; // 1 = EmbeddedLibrary, 2 = OptionalDependency, 3 = RequiredDependency, 4 = Tool, 5 = Incompatible, 6 = Include
    name: string;
  }>;
  downloadUrl: string;
  gameVersions: string[];
  gameVersionTypIds: number[];
  fileFingerprint: string;
  modules: Array<{
    name: string;
    fingerprint: number;
  }>;
}

export interface SearchParams {
  gameId: number; // 4471 for Minecraft
  classId?: number; // Category ID (e.g., 6 for Mods, 12 for Resource Packs, etc.)
  categoryId?: number; // Specific category ID
  gameVersion?: string; // Minecraft version (e.g., "1.19.2")
  searchFilter?: string; // Search term
  modLoaderType?: number; // 0=Any, 1=Forge, 2=Cauldron, 3=LiteLoader, 4=Fabric, 5=Quilt
  gameVersionTypeId?: number; // Type of game version
  index?: number; // Result index for pagination
  pageSize?: number; // Number of results to return
  sortField?: number; // 1=Featured, 2=Popularity, 3=LastUpdated, 4=Name, 5=Author, 6=TotalDownloads
  sortOrder?: 'asc' | 'dsc'; // Ascending or descending
  modStatus?: number; // 1=Any, 2=Approved, 3=Unpublished, 4=Rejected, 5=Malware
}

export interface CompatibleVersionQuery {
  projectId: string;
  mcVersion: string;
  loader?: string;
}

/**
 * Class for handling CurseForge API interactions
 */
export class CurseForgeAPI_Handler {
  private baseUrl = 'https://api.curseforge.com/v1';
  private apiKey: string | null = null;
  private userAgent = 'Drakkar-ModLauncher/1.0.0 (haroldmuller2015@gmail.com)';

  constructor() {
    // Initialize with API key from settings or environment
    this.loadApiKey();
  }

  /**
   * Load API key from settings
   */
  private loadApiKey(): void {
    try {
      // Using the API key provided by CurseForge team
      this.apiKey = '$2a$10$8qrneNohy/pV0jJKZVbUuu.kXuDwlRmfhnf4o.7VGEN/bEjXTOPWC';
    } catch (error) {
      console.warn('Could not load CurseForge API key:', error);
      this.apiKey = null;
    }
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': this.userAgent,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    // CurseForge requires the API key in the X-API-Key header
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    return headers;
  }

  /**
   * Search for mods on CurseForge
   * @param params Search parameters
   * @returns Array of CurseForgeMod
   */
  async searchMods(params: SearchParams): Promise<CurseForgeMod[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('gameId', params.gameId.toString());
      
      if (params.classId) queryParams.append('classId', params.classId.toString());
      if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
      if (params.gameVersion) queryParams.append('gameVersion', params.gameVersion);
      if (params.searchFilter) queryParams.append('searchFilter', params.searchFilter);
      if (params.modLoaderType !== undefined) queryParams.append('modLoaderType', params.modLoaderType.toString());
      if (params.gameVersionTypeId) queryParams.append('gameVersionTypeId', params.gameVersionTypeId.toString());
      if (params.index) queryParams.append('index', params.index.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.sortField) queryParams.append('sortField', params.sortField.toString());
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.modStatus) queryParams.append('modStatus', params.modStatus.toString());

      const response = await fetch(
        `${this.baseUrl}/mods/search?${queryParams.toString()}`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`CurseForge API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data as CurseForgeMod[];
    } catch (error) {
      console.error('Error searching CurseForge mods:', error);
      throw error;
    }
  }

  /**
   * Get a specific mod by ID
   * @param modId The mod ID
   * @returns CurseForgeMod
   */
  async getMod(modId: number): Promise<CurseForgeMod> {
    try {
      const response = await fetch(
        `${this.baseUrl}/mods/${modId}`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`CurseForge API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data as CurseForgeMod;
    } catch (error) {
      console.error(`Error getting CurseForge mod ${modId}:`, error);
      throw error;
    }
  }

  /**
   * Get all files for a mod
   * @param modId The mod ID
   * @returns Array of CurseForgeFile
   */
  async getModFiles(modId: number): Promise<CurseForgeFile[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/mods/${modId}/files`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`CurseForge API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data as CurseForgeFile[];
    } catch (error) {
      console.error(`Error getting CurseForge mod files for ${modId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific file for a mod
   * @param modId The mod ID
   * @param fileId The file ID
   * @returns CurseForgeFile
   */
  async getModFile(modId: number, fileId: number): Promise<CurseForgeFile> {
    try {
      const response = await fetch(
        `${this.baseUrl}/mods/${modId}/files/${fileId}`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`CurseForge API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data as CurseForgeFile;
    } catch (error) {
      console.error(`Error getting CurseForge file ${fileId} for mod ${modId}:`, error);
      throw error;
    }
  }

  /**
   * Get compatible versions for a mod
   * @param modId The mod ID
   * @param mcVersion Minecraft version
   * @param loader Optional loader (e.g., forge, fabric)
   * @returns Array of compatible versions
   */
  async getCompatibleVersions(modId: number, mcVersion: string, loader?: string): Promise<any[]> {
    try {
      const files = await this.getModFiles(modId);
      return files.filter(file => {
        const versionMatch = file.gameVersions.includes(mcVersion);
        if (!loader) return versionMatch;

        // Convert loader string to modLoaderType ID for comparison
        const loaderMap: Record<string, number> = {
          'forge': 1,
          'fabric': 4,
          'quilt': 5,
          'neoforge': 6
        };
        
        const loaderId = loaderMap[loader.toLowerCase()];
        return versionMatch && (!loaderId || file.gameVersionTypIds.includes(loaderId));
      });
    } catch (error) {
      console.error(`Error getting compatible versions for mod ${modId}:`, error);
      throw error;
    }
  }

  /**
   * Get dependencies for a specific mod
   * @param modId The mod ID
   * @returns Dependencies information
   */
  async getModDependencies(modId: number): Promise<any> {
    try {
      // First get the mod information
      const mod = await this.getMod(modId);

      // Get all files for the mod to access file dependencies
      const files = await this.getModFiles(modId);

      // Extract dependencies from each file
      const allDependencies = [];
      for (const file of files) {
        if (file.fileDependencies && file.fileDependencies.length > 0) {
          allDependencies.push(...file.fileDependencies.map(dep => ({
            ...dep,
            fileName: file.displayName,
            fileId: file.id
          })));
        }
      }

      // Remove duplicates based on modId
      const uniqueDependencies = allDependencies.filter((dep, index, self) =>
        index === self.findIndex(d => d.modId === dep.modId)
      );

      return {
        modInfo: mod,
        dependencies: uniqueDependencies,
        files: files
      };
    } catch (error) {
      console.error(`Error getting dependencies for CurseForge mod ${modId}:`, error);
      throw error;
    }
  }

  /**
   * Get all game versions (Minecraft versions)
   * @returns Array of game version strings
   */
  async getGameVersions(): Promise<string[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/games/4471/versions`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`CurseForge API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const versions = data.data as Array<{id: number, name: string, slug: string}>;
      return versions.map(v => v.name);
    } catch (error) {
      console.error('Error getting CurseForge game versions:', error);
      throw error;
    }
  }

  /**
   * Get all mod loaders (Forge, Fabric, etc.)
   * @returns Array of mod loader objects
   */
  async getModLoaders(): Promise<{id: number, name: string, slug: string}[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/games/4471/modloader-types`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`CurseForge API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data as Array<{id: number, name: string, slug: string}>;
    } catch (error) {
      console.error('Error getting CurseForge mod loaders:', error);
      throw error;
    }
  }

  /**
   * Download a file by URL
   * @param downloadUrl The download URL
   * @param filename The filename to save as
   * @param displayName Display name for the download
   * @returns Promise that resolves when download is initiated
   */
  async downloadFile(downloadUrl: string, filename: string, displayName: string): Promise<void> {
    try {
      // Use the download service to handle the download
      downloadService.downloadFile(downloadUrl, filename, displayName);
    } catch (error) {
      console.error(`Error initiating download for ${filename}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const curseForgeAPI = new CurseForgeAPI_Handler();