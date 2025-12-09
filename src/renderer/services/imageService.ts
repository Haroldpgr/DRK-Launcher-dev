// src/renderer/services/imageService.ts
export const imageService = {
  /**
   * Generates a placeholder image URL for a server when no image is available
   * @param serverName The name of the server
   * @returns A URL to a placeholder image
   */
  getPlaceholderImage: (serverName: string): string => {
    // Use UI Avatars service to generate a placeholder with server name
    const firstLetter = serverName.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(serverName)}&background=4f46e5&color=ffffff&size=400`;
  },

  /**
   * Generates a Minecraft server placeholder using a Minecraft-themed service
   * @param serverName The name of the server
   * @returns A URL to a Minecraft-themed placeholder image
   */
  getMinecraftPlaceholder: (serverName: string): string => {
    // Use a Minecraft-themed placeholder service
    return `https://eu.mc-api.net/v3/server/image/${encodeURIComponent(serverName)}.png`;
  },

  /**
   * Validates if an image URL is accessible
   * @param url The image URL to validate
   * @returns A promise that resolves to true if the image is accessible
   */
  validateImage: async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok && response.headers.get('content-type')?.startsWith('image/');
    } catch {
      return false;
    }
  },

  /**
   * Gets a fallback image for a server, trying multiple options
   * @param serverName The name of the server
   * @param customThumbnail An optional custom thumbnail URL
   * @returns A URL to a suitable image
   */
  getServerImage: async (serverName: string, customThumbnail?: string): Promise<string> => {
    if (customThumbnail) {
      // Validate custom thumbnail first
      if (await this.validateImage(customThumbnail)) {
        return customThumbnail;
      }
    }

    // Try Minecraft-themed placeholder
    const mcPlaceholder = this.getMinecraftPlaceholder(serverName);
    if (await this.validateImage(mcPlaceholder)) {
      return mcPlaceholder;
    }

    // Fallback to generic placeholder
    return this.getPlaceholderImage(serverName);
  }
};