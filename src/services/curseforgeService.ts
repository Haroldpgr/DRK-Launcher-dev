import fetch from 'node-fetch';

// API Key provided by the user
const CURSEFORGE_API_KEY = '$2a$10$8qrneNohy/pV0jJKZVbUuu.kXuDwlRmfhnf4o.7VGEN/bEjXTOPWC';
const CURSEFORGE_API_URL = 'https://api.curseforge.com/v1';

// Define types for CurseForge content
interface CurseForgeMod {
  id: number;
  name: string;
  summary: string;
  authors: { name: string }[];
  downloadCount: number;
  dateModified: string;
  gameVersionLatestFiles: { gameVersion: string }[];
  categories: { name: string }[];
  logo: { thumbnailUrl: string };
  links: { websiteUrl: string };
  latestFiles: { fileName: string; downloadUrl?: string }[];
}

interface CurseForgeSearchResponse {
  data: {
    data: CurseForgeMod[];
  };
}

// Map our content types to CurseForge category IDs
const curseForgeCategoryIds: { [key: string]: number } = {
  modpacks: 4471,  // Modpacks
  mods: 6,          // Minecraft Mods
  resourcepacks: 12, // Resource Packs
  datapacks: 5269,   // Data Packs
  shaders: 6552      // Shaders
};

// Map our content types to their display names
const contentTypeNames: { [key: string]: string } = {
  modpacks: 'Modpacks',
  mods: 'Mods',
  resourcepacks: 'Resource Packs',
  datapacks: 'Data Packs',
  shaders: 'Shaders'
};

export class CurseForgeService {
  private headers = {
    'X-API-Key': CURSEFORGE_API_KEY,
    'Content-Type': 'application/json',
    'User-Agent': 'DRK-Launcher/1.0 (contacto@drklauncher.com)'
  };

  async searchContent(contentType: string, search: string = ''): Promise<any[]> {
    try {
      // Get the category ID for the content type
      const categoryId = curseForgeCategoryIds[contentType];
      if (!categoryId) {
        console.error('Invalid content type for CurseForge:', contentType);
        return [];
      }

      // Fetch multiple pages to get more results (up to 1000 total, close to API limits)
      const allResults: any[] = [];
      const PAGE_SIZE = 50; // Use a reasonable page size
      let index = 0;
      const maxResults = 1000; // Maximum results to fetch (near API limits)

      // First, get the total count to determine how many pages to fetch
      const firstPageParams = new URLSearchParams({
        gameId: '432', // Minecraft game ID for CurseForge API
        classId: categoryId.toString(),
        searchFilter: search || '',
        sortField: (search ? 2 : 3).toString(), // Sort by relevance if searching, otherwise by download count
        sortOrder: '2', // Descending order
        index: index.toString(),
        pageSize: PAGE_SIZE.toString()
      });

      const firstPageUrl = `${CURSEFORGE_API_URL}/mods/search?${firstPageParams}`;
      console.log('Searching CurseForge first page:', firstPageUrl);

      // Set up timeout for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const firstResponse = await fetch(firstPageUrl, {
        method: 'GET',
        headers: this.headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!firstResponse.ok) {
        const errorBody = await firstResponse.text();
        console.error(`Error fetching from CurseForge: ${firstResponse.status} ${firstResponse.statusText}`, errorBody);
        throw new Error(`Error from CurseForge API: ${firstResponse.statusText}`);
      }

      const firstJson: any = await firstResponse.json();
      console.log('CurseForge first page response:', firstJson);

      // Process the first page
      let firstPageItems: any[] = [];
      if (firstJson && firstJson.data && Array.isArray(firstJson.data)) {
        firstPageItems = firstJson.data;
      } else if (firstJson && firstJson.data && firstJson.data.data && Array.isArray(firstJson.data.data)) {
        firstPageItems = firstJson.data.data;
      } else if (Array.isArray(firstJson)) {
        firstPageItems = firstJson;
      }

      allResults.push(...firstPageItems);

      // Continue fetching pages until we have enough results or no more pages
      while (allResults.length < maxResults && firstPageItems.length === PAGE_SIZE) {
        index += PAGE_SIZE;
        if (allResults.length >= maxResults) break;

        // Prepare the search parameters for the next page
        const nextParams = new URLSearchParams({
          gameId: '432', // Minecraft game ID for CurseForge API
          classId: categoryId.toString(),
          searchFilter: search || '',
          sortField: (search ? 2 : 3).toString(), // Sort by relevance if searching, otherwise by download count
          sortOrder: '2', // Descending order
          index: index.toString(),
          pageSize: PAGE_SIZE.toString()
        });

        const nextUrl = `${CURSEFORGE_API_URL}/mods/search?${nextParams}`;
        console.log(`Searching CurseForge page ${index/PAGE_SIZE + 1}:`, nextUrl);

        const nextController = new AbortController();
        const nextTimeoutId = setTimeout(() => nextController.abort(), 15000); // 15 second timeout

        const nextResponse = await fetch(nextUrl, {
          method: 'GET',
          headers: this.headers,
          signal: nextController.signal
        });

        clearTimeout(nextTimeoutId);

        if (!nextResponse.ok) {
          const errorBody = await nextResponse.text();
          console.error(`Error fetching from CurseForge: ${nextResponse.status} ${nextResponse.statusText}`, errorBody);
          break; // Stop if there's an error
        }

        const nextJson: any = await nextResponse.json();
        console.log(`CurseForge page ${index/PAGE_SIZE + 1} response:`, nextJson);

        let nextPageItems: any[] = [];
        if (nextJson && nextJson.data && Array.isArray(nextJson.data)) {
          nextPageItems = nextJson.data;
        } else if (nextJson && nextJson.data && nextJson.data.data && Array.isArray(nextJson.data.data)) {
          nextPageItems = nextJson.data.data;
        } else if (Array.isArray(nextJson)) {
          nextPageItems = nextJson;
        }

        if (nextPageItems.length === 0) {
          break; // No more results
        }

        allResults.push(...nextPageItems);

        if (nextPageItems.length < PAGE_SIZE) {
          break; // Last page
        }
      }

      // Limit to maxResults if needed
      const finalResults = allResults.slice(0, maxResults);

      return finalResults.map(item => ({
        id: item.id ? item.id.toString() : Math.random().toString(36).substr(2, 9), // Convert to string to match our existing format
        title: item.name || item.title || 'Unknown Title',
        description: item.summary || item.description || 'No description available',
        author: (item.authors && item.authors.length > 0) ? item.authors[0].name : item.author || 'Unknown',
        downloads: item.downloadCount || item.downloads || 0,
        lastUpdated: item.dateModified || item.lastUpdated || new Date().toISOString(),
        minecraftVersions: (item.gameVersionLatestFiles ? item.gameVersionLatestFiles.map((f: any) => f.gameVersion) :
                          item.gameVersions ? item.gameVersions : []),
        categories: (item.categories ? item.categories.map((c: any) => c.name) :
                    item.categorySection?.name ? [item.categorySection.name] : []),
        imageUrl: this.getBestImageUrl(item), // Use a dedicated method to get the best image
        type: contentType as 'modpacks' | 'mods' | 'resourcepacks' | 'datapacks' | 'shaders',
        version: (item.latestFiles && item.latestFiles.length > 0) ? item.latestFiles[0].fileName || item.version :
                  item.file?.fileName || item.version || 'N/A',
        downloadUrl: (item.latestFiles && item.latestFiles.length > 0) ? item.latestFiles[0].downloadUrl :
                   item.downloadUrl || undefined
      }));
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('CurseForge request timed out:', error);
        throw new Error('CurseForge request timed out');
      }
      console.error('Error fetching content from CurseForge:', error);
      return []; // Return empty array in case of error
    }
  }

  // Method to get the best available image URL
  private getBestImageUrl(item: any): string {
    // Check multiple possible image properties in order of preference
    const imageUrl =
      item.logo?.url ||
      item.logo?.thumbnailUrl ||
      item.logo?.imageUrl ||
      item.primaryScreenshot?.url ||
      (item.screenshots && item.screenshots.length > 0 ? item.screenshots[0]?.url : null) ||
      item.thumbnailUrl ||
      item.thumbnail?.url ||
      item.imageUrl ||
      'https://via.placeholder.com/400x200';

    return imageUrl;
  }

  // Get compatible versions for a specific project
  async getCompatibleVersions(projectId: string, mcVersion: string, loader?: string) {
    try {
      const response = await fetch(`${CURSEFORGE_API_URL}/mods/${projectId}/files`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Error fetching files for project ${projectId}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Process CurseForge files to match our existing format
      // For now, return an empty array as the format conversion is complex and requires more research
      // This method may need to be implemented differently based on CurseForge API response structure
      console.log('CurseForge files response:', data);
      
      // Return an empty array for now - this needs to be properly implemented
      return [];
    } catch (error) {
      console.error(`Error getting compatible versions for project ${projectId}:`, error);
      return [];
    }
  }
}

export const curseforgeService = new CurseForgeService();