const imageService = {
  /**
   * Generates a placeholder image URL for a server when no image is available
   * @param serverName The name of the server
   * @returns A URL to a placeholder image
   */
  getPlaceholderImage: (serverName) => {
    serverName.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(serverName)}&background=4f46e5&color=ffffff&size=400`;
  },
  /**
   * Generates a Minecraft server placeholder using a Minecraft-themed service
   * @param serverName The name of the server
   * @returns A URL to a Minecraft-themed placeholder image
   */
  getMinecraftPlaceholder: (serverName) => {
    return `https://eu.mc-api.net/v3/server/image/${encodeURIComponent(serverName)}.png`;
  },
  /**
   * Validates if an image URL is accessible
   * @param url The image URL to validate
   * @returns A promise that resolves to true if the image is accessible
   */
  validateImage: async (url) => {
    var _a;
    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok && ((_a = response.headers.get("content-type")) == null ? void 0 : _a.startsWith("image/"));
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
  getServerImage: async (serverName, customThumbnail) => {
    if (customThumbnail) {
      if (await (void 0).validateImage(customThumbnail)) {
        return customThumbnail;
      }
    }
    const mcPlaceholder = (void 0).getMinecraftPlaceholder(serverName);
    if (await (void 0).validateImage(mcPlaceholder)) {
      return mcPlaceholder;
    }
    return (void 0).getPlaceholderImage(serverName);
  }
};
export {
  imageService as i
};
