import { settingsService } from './settingsService';

/**
 * Interface for Modrinth API Project response
 */
export interface ModrinthProject {
  id: string;
  slug: string;
  project_type: string;
  team: string;
  title: string;
  description: string;
  body: string;
  published: string;
  updated: string;
  status: string;
  downloads: number;
  follows: number;
  categories: string[];
  additional_categories: string[];
  issues_url?: string;
  source_url?: string;
  wiki_url?: string;
  discord_url?: string;
  donation_urls?: any[];
  gallery: ModrinthGalleryImage[];
  featured_gallery?: string;
  version_ids: string[];
  versions: string[];
  icon_url?: string;
}

/**
 * Interface for Modrinth Gallery Image
 */
export interface ModrinthGalleryImage {
  url: string;
  featured: boolean;
  title?: string;
  description?: string;
  created: string;
}

/**
 * Interface for Modrinth Version response
 */
export interface ModrinthVersion {
  id: string;
  project_id: string;
  author_id: string;
  name: string;
  version_number: string;
  changelog?: string;
  changelog_url?: string;
  date_published: string;
  downloads: number;
  version_type: 'release' | 'beta' | 'alpha';
  files: ModrinthFile[];
  dependencies: ModrinthDependency[];
  game_versions: string[];
  loaders: string[];
}

/**
 * Interface for Modrinth File
 */
export interface ModrinthFile {
  hashes: { [algorithm: string]: string };
  url: string;
  filename: string;
  primary: boolean;
  size: number;
  file_type?: 'required-resource-pack' | 'optional-resource-pack' | 'unknown';
}

/**
 * Interface for Modrinth Dependency
 */
export interface ModrinthDependency {
  version_id?: string;
  project_id?: string;
  file_id?: string;
  dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded';
}

/**
 * Interface for search parameters
 */
export interface SearchParams {
  query?: string;
  limit?: number;
  offset?: number;
  facets?: string[][];
  version?: string[];
  loader?: string[];
  environment?: 'client' | 'server';
  project_type?: 'mod' | 'modpack' | 'resourcepack' | 'shader';
  license?: string;
  downloads?: [number, number];
  follows?: [number, number];
  color?: number;
  show_beta?: boolean;
  show_alpha?: boolean;
  sort?: {
    field: 'relevance' | 'downloads' | 'follows' | 'newest' | 'updated';
    direction: 'asc' | 'desc';
  };
}

/**
 * Interface for compatible version query
 */
export interface CompatibleVersionQuery {
  projectId: string;
  mcVersion: string;
  loader?: string;
}

/**
 * Class for handling Modrinth API interactions
 */
export class ModrinthAPI_Handler {
  private baseUrl = 'https://api.modrinth.com/v2';
  private userAgent = 'Drakkar-ModLauncher/1.0.0 (haroldmuller2015@gmail.com)';

  /**
   * Search for projects on Modrinth
   * @param params Search parameters
   * @returns Array of ModrinthProject
   */
  async searchProjects(params: SearchParams): Promise<ModrinthProject[]> {
    try {
      // Construct query parameters
      const queryParams = new URLSearchParams();
      
      if (params.query) queryParams.append('query', params.query);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.version && params.version.length > 0) {
        queryParams.append('game_versions', JSON.stringify(params.version));
      }
      if (params.loader && params.loader.length > 0) {
        queryParams.append('loaders', JSON.stringify(params.loader));
      }
      if (params.environment) queryParams.append('environment', params.environment);
      if (params.project_type) queryParams.append('project_type', params.project_type);
      if (params.license) queryParams.append('license', params.license);
      if (params.downloads) queryParams.append('downloads', JSON.stringify(params.downloads));
      if (params.follows) queryParams.append('follows', JSON.stringify(params.follows));
      if (params.color) queryParams.append('color', params.color.toString());
      if (params.show_beta !== undefined) queryParams.append('show_beta', params.show_beta.toString());
      if (params.show_alpha !== undefined) queryParams.append('show_alpha', params.show_alpha.toString());
      
      // Add facets if provided - these are complex filters in Modrinth API
      if (params.facets && params.facets.length > 0) {
        queryParams.append('facets', JSON.stringify(params.facets));
      }

      // Add sorting
      if (params.sort) {
        queryParams.append('sort', params.sort.field);
        queryParams.append('sort_direction', params.sort.direction);
      }

      const response = await fetch(
        `${this.baseUrl}/search?${queryParams.toString()}`,
        {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Modrinth API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.hits as ModrinthProject[];
    } catch (error) {
      console.error('Error searching Modrinth projects:', error);
      throw error;
    }
  }

  /**
   * Get a project by its ID
   * @param projectId The project ID or slug
   * @returns ModrinthProject
   */
  async getProject(projectId: string): Promise<ModrinthProject> {
    try {
      const response = await fetch(
        `${this.baseUrl}/project/${projectId}`,
        {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Modrinth API error: ${response.status} ${response.statusText}`);
      }

      return await response.json() as ModrinthProject;
    } catch (error) {
      console.error(`Error getting Modrinth project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get all versions for a project
   * @param projectId The project ID or slug
   * @returns Array of ModrinthVersion
   */
  async getProjectVersions(projectId: string): Promise<ModrinthVersion[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/project/${projectId}/version`,
        {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Modrinth API error: ${response.status} ${response.statusText}`);
      }

      return await response.json() as ModrinthVersion[];
    } catch (error) {
      console.error(`Error getting Modrinth project versions ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get versions compatible with specific game version and loader
   * @param query Compatible version query parameters
   * @returns Array of ModrinthVersion
   */
  async getCompatibleVersions(query: CompatibleVersionQuery): Promise<ModrinthVersion[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/project/${query.projectId}/version`,
        {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Modrinth API error: ${response.status} ${response.statusText}`);
      }

      const versions: ModrinthVersion[] = await response.json();
      
      // Filter based on game version and loader
      return versions.filter(version => {
        const gameVersionMatch = !query.mcVersion || version.game_versions.includes(query.mcVersion);
        const loaderMatch = !query.loader || version.loaders.includes(query.loader);
        return gameVersionMatch && loaderMatch;
      });
    } catch (error) {
      console.error(`Error getting compatible versions for project ${query.projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get specific version by ID
   * @param versionId The version ID
   * @returns ModrinthVersion
   */
  async getVersion(versionId: string): Promise<ModrinthVersion> {
    try {
      const response = await fetch(
        `${this.baseUrl}/version/${versionId}`,
        {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Modrinth API error: ${response.status} ${response.statusText}`);
      }

      return await response.json() as ModrinthVersion;
    } catch (error) {
      console.error(`Error getting Modrinth version ${versionId}:`, error);
      throw error;
    }
  }

  /**
   * Download a file by URL
   * @param downloadUrl The download URL
   * @param filename The filename to save as
   * @returns Promise that resolves when download is complete
   */
  async downloadFile(downloadUrl: string, filename: string): Promise<void> {
    try {
      // This would be handled by the main download service in the application
      // For now we'll return a promise that indicates the download URL is ready
      console.log(`Prepared to download from: ${downloadUrl} as ${filename}`);
    } catch (error) {
      console.error(`Error preparing download for ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific file from a version by its ID
   * @param fileId The file ID
   * @returns ModrinthFile
   */
  async getFile(fileId: string): Promise<ModrinthFile> {
    // Note: Modrinth doesn't have a direct API endpoint for files
    // This would typically be handled by getting the version that contains the file
    throw new Error('Modrinth does not have a direct file API endpoint. Get the version containing the file instead.');
  }
}

// Export a singleton instance
export const modrinthAPI = new ModrinthAPI_Handler();