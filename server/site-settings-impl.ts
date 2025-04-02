// MemStorage class implementation for site settings
export const memStorageSiteSettingsImpl = `
  // Site Settings operations
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    return this.siteSettingsRecord;
  }
  
  async updateSiteSettings(settings: Partial<InsertSiteSettings>): Promise<SiteSettings> {
    const now = new Date();
    if (!this.siteSettingsRecord) {
      // Create initial settings if they don't exist
      this.siteSettingsRecord = {
        id: 1,
        siteName: settings.siteName || "StreamHive",
        logoUrl: settings.logoUrl || null,
        primaryColor: settings.primaryColor || "#3b82f6",
        enableSubscriptions: settings.enableSubscriptions ?? true,
        enablePPV: settings.enablePPV ?? false,
        enableRegistration: settings.enableRegistration ?? true,
        defaultUserQuota: settings.defaultUserQuota ?? 5,
        defaultUserConcurrentStreams: settings.defaultUserConcurrentStreams ?? 2,
        lastUpdated: now
      };
    } else {
      // Update existing settings
      this.siteSettingsRecord = {
        ...this.siteSettingsRecord,
        ...settings,
        lastUpdated: now
      };
    }
    
    return this.siteSettingsRecord;
  }
`;

// DatabaseStorage class implementation for site settings
export const dbStorageSiteSettingsImpl = `
  // Site Settings operations
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    try {
      const [settings] = await db.select().from(siteSettings).limit(1);
      return settings;
    } catch (error) {
      console.error("Error getting site settings:", error);
      return undefined;
    }
  }
  
  async updateSiteSettings(settingsData: Partial<InsertSiteSettings>): Promise<SiteSettings> {
    try {
      const currentSettings = await this.getSiteSettings();
      const now = new Date();
      
      if (!currentSettings) {
        // Create new settings if they don't exist
        const [newSettings] = await db.insert(siteSettings).values({
          siteName: settingsData.siteName || "StreamHive",
          logoUrl: settingsData.logoUrl,
          primaryColor: settingsData.primaryColor || "#3b82f6",
          enableSubscriptions: settingsData.enableSubscriptions ?? true,
          enablePPV: settingsData.enablePPV ?? false,
          enableRegistration: settingsData.enableRegistration ?? true,
          defaultUserQuota: settingsData.defaultUserQuota ?? 5,
          defaultUserConcurrentStreams: settingsData.defaultUserConcurrentStreams ?? 2,
          lastUpdated: now
        }).returning();
        
        return newSettings;
      } else {
        // Update existing settings
        const [updatedSettings] = await db.update(siteSettings)
          .set({
            ...settingsData,
            lastUpdated: now
          })
          .where(eq(siteSettings.id, currentSettings.id))
          .returning();
          
        return updatedSettings;
      }
    } catch (error) {
      console.error("Error updating site settings:", error);
      throw new Error("Failed to update site settings");
    }
  }
`;