import axios from 'axios';
import * as xml2js from 'xml2js';
import { storage } from './storage';
import { InsertProgram, InsertEPGSource, InsertEPGImportJob, InsertEPGChannelMapping, EPGChannelMapping } from '@shared/schema';
import { db } from './db';
import { eq } from 'drizzle-orm';

type WebGrabConfig = {
  siteIni: string;
  channels: Array<{
    channelId: number;
    displayName: string;
    siteId: string;
  }>;
  timespan: number; // days to grab
  update: 'i' | 'g' | 'f'; // incremental, grab all, forced
};

type EPGChannel = {
  $: {
    id: string;
    'display-name': string;
  };
};

type EPGProgram = {
  $: {
    start: string;
    stop: string;
    channel: string;
  };
  title: string[];
  desc?: string[];
  category?: string[];
  'episode-num'?: string[];
  rating?: Array<{ $: { system: string; value: string } }>;
  'sub-title'?: string[];
  director?: string[];
  actor?: string[];
  date?: string[]; // Year of production
};

/**
 * Service for handling EPG (Electronic Program Guide) operations
 * Uses WebGrab+Plus compatible data format
 */
export class EPGService {
  /**
   * Fetches EPG data from a URL and processes it
   */
  async fetchAndProcessEPG(sourceId: number): Promise<{
    success: boolean;
    jobId?: number;
    message: string;
    programsImported?: number;
    channelsImported?: number;
    channelCount?: number;
    programCount?: number;
    errors?: string[];
  }> {
    try {
      // Get the EPG source information
      const source = await storage.getEPGSource(sourceId);
      if (!source) {
        return { success: false, message: 'EPG source not found' };
      }

      // Create an import job record
      const job = await storage.createEPGImportJob({
        epgSourceId: sourceId,
        startTime: new Date(),
        status: 'processing',
      });

      console.log(`Starting EPG import job ${job.id} for source: ${source.name}`);

      // Fetch XML data from the URL
      const response = await axios.get(source.url, {
        responseType: 'text',
        headers: {
          'Accept': 'application/xml, text/xml, */*',
          'User-Agent': 'StreamHive/1.0 EPG Service'
        }
      });

      const xmlData = response.data;

      // Parse XML to JSON
      const parser = new xml2js.Parser({ explicitArray: true });
      const result = await parser.parseStringPromise(xmlData);

      if (!result.tv || !result.tv.channel || !result.tv.programme) {
        await this.updateJobStatus(job.id, 'failed', 0, 0, ['Invalid XMLTV format']);
        return { 
          success: false, 
          jobId: job.id,
          message: 'Invalid XMLTV format', 
          errors: ['Invalid XMLTV format'] 
        };
      }

      // Process channels
      const channels = result.tv.channel as EPGChannel[];
      const programmes = result.tv.programme as EPGProgram[];

      console.log(`Found ${channels.length} channels and ${programmes.length} programs in EPG data`);
      
      // Import channels
      const importedChannelIds = await this.importChannels(sourceId, channels);
      
      // Import programs
      const importedPrograms = await this.importPrograms(programmes, sourceId);

      // Update job status
      const jobResult = await this.updateJobStatus(
        job.id, 
        'completed', 
        importedPrograms.length, 
        importedChannelIds.length
      );

      // Update source with channel count and last update time
      await storage.updateEPGSource(sourceId, {
        channelCount: importedChannelIds.length,
        lastUpdate: new Date()
      });

      return {
        success: true,
        jobId: job.id,
        message: `Successfully imported ${importedPrograms.length} programs for ${importedChannelIds.length} channels`,
        programsImported: importedPrograms.length,
        channelsImported: importedChannelIds.length,
        channelCount: importedChannelIds.length,
        programCount: importedPrograms.length
      };
    } catch (error) {
      console.error('Error in EPG import:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error in EPG import' 
      };
    }
  }

  /**
   * Import channels from EPG data
   */
  private async importChannels(sourceId: number, channels: EPGChannel[]): Promise<number[]> {
    const importedChannelIds: number[] = [];
    
    for (const channel of channels) {
      const channelId = channel.$.id;
      const displayName = channel.$['display-name'];
      
      // Check if we have this channel mapping already
      const existingMappings = await db.query.epgChannelMappings.findMany({
        where: (mapping, { and, eq }) => and(
          eq(mapping.epgSourceId, sourceId),
          eq(mapping.externalChannelId, channelId)
        )
      });
      
      if (existingMappings.length > 0) {
        // Update the mapping if name changed
        if (existingMappings[0].externalChannelName !== displayName) {
          await storage.updateEPGChannelMapping(existingMappings[0].id, {
            externalChannelName: displayName,
            lastUpdated: new Date()
          });
        }
        importedChannelIds.push(existingMappings[0].channelId);
        continue;
      }
      
      // Try to find a matching channel by name in our system
      const systemChannels = await storage.getChannels();
      const matchingChannels = systemChannels.filter(c => 
        c.name.toLowerCase() === displayName.toLowerCase() ||
        c.name.toLowerCase().includes(displayName.toLowerCase()) ||
        displayName.toLowerCase().includes(c.name.toLowerCase())
      );
      
      if (matchingChannels.length > 0) {
        // Create a mapping for the first matching channel
        const mapping: InsertEPGChannelMapping = {
          channelId: matchingChannels[0].id,
          epgSourceId: sourceId,
          externalChannelId: channelId,
          externalChannelName: displayName,
          isActive: true
        };
        
        await storage.createEPGChannelMapping(mapping);
        importedChannelIds.push(matchingChannels[0].id);
      }
    }
    
    return importedChannelIds;
  }

  /**
   * Import programs from EPG data
   */
  private async importPrograms(programmes: EPGProgram[], sourceId: number): Promise<InsertProgram[]> {
    const importedPrograms: InsertProgram[] = [];
    
    // Get channel mappings for this source
    const channelMappings = await storage.getEPGChannelMappings(sourceId);
    
    if (channelMappings.length === 0) {
      console.log('No channel mappings found for EPG source');
      return [];
    }
    
    // Create a map for faster lookups
    const channelMap = new Map(
      channelMappings.map((mapping: EPGChannelMapping) => [mapping.externalChannelId, mapping.channelId])
    );
    
    console.log(`Processing ${programmes.length} programs for source ID ${sourceId}`);
    console.log(`Found ${channelMappings.length} channel mappings for this source`);
    
    let processedCount = 0;
    let insertedCount = 0;
    
    for (const programme of programmes) {
      processedCount++;
      const externalChannelId = programme.$.channel;
      const internalChannelId = channelMap.get(externalChannelId);
      
      if (!internalChannelId) {
        // No mapping for this channel
        continue;
      }
      
      // Parse timestamps
      const startTime = this.parseXMLTVDate(programme.$.start);
      const endTime = this.parseXMLTVDate(programme.$.stop);
      
      if (!startTime || !endTime) {
        console.warn(`Invalid date format for program: ${programme.title[0]}`);
        continue;
      }
      
      // Extract episode information if available
      let season: number | undefined;
      let episode: number | undefined;
      let episodeTitle: string | undefined;
      
      if (programme['sub-title'] && programme['sub-title'].length > 0) {
        episodeTitle = programme['sub-title'][0];
      }
      
      if (programme['episode-num'] && programme['episode-num'].length > 0) {
        const episodeNum = programme['episode-num'][0];
        // Fix the regex pattern to handle proper backslashes
        const match = episodeNum.match(/^(\d+)\.(\d+)/);
        if (match) {
          season = parseInt(match[1]) + 1; // XMLTV uses 0-based seasons
          episode = parseInt(match[2]) + 1; // XMLTV uses 0-based episodes
        }
      }
      
      // Extract year if available
      let year: number | undefined;
      if (programme.date && programme.date.length > 0) {
        const yearStr = programme.date[0];
        if (yearStr.match(/^\d{4}$/)) {
          year = parseInt(yearStr);
        }
      }
      
      // Extract directors if available
      const directors = programme.director || [];
      
      // Extract cast if available
      const castMembers = programme.actor || [];
      
      // Extract category if available
      let category: string | undefined;
      if (programme.category && programme.category.length > 0) {
        category = programme.category[0];
      }
      
      // Create program object with proper field handling
      const programData: InsertProgram = {
        channelId: internalChannelId,
        title: programme.title[0],
        startTime,
        endTime,
        description: programme.desc && programme.desc.length > 0 ? programme.desc[0] : null,
        category: category || null,
        posterUrl: null, // XMLTV doesn't typically include poster URLs
        episodeTitle: episodeTitle || null,
        season: season || null,
        episode: episode || null,
        year: year || null,
        directors: directors.length > 0 ? directors : [],
        castMembers: castMembers.length > 0 ? castMembers : [],
        rating: null,
        isFeatured: false,
        externalId: externalChannelId // Store the external channel ID to help with mappings
      };
      
      try {
        // Check if this program already exists to avoid duplicates
        const existingPrograms = await db.query.programs.findMany({
          where: (programs, { and, eq }) => and(
            eq(programs.channelId, programData.channelId),
            eq(programs.startTime, programData.startTime),
            eq(programs.title, programData.title)
          ),
          limit: 1
        });
        
        if (existingPrograms.length === 0) {
          // Insert new program
          const newProgram = await storage.createProgram(programData);
          importedPrograms.push(programData);
          insertedCount++;
          
          if (insertedCount % 10 === 0) {
            console.log(`Inserted ${insertedCount} programs so far...`);
          }
        }
      } catch (error) {
        console.error(`Failed to process program: ${programData.title}`, error);
      }
      
      // Log progress occasionally
      if (processedCount % 100 === 0) {
        console.log(`Processed ${processedCount}/${programmes.length} programs...`);
      }
    }
    
    console.log(`Import complete: Processed ${processedCount} programs, inserted ${insertedCount} new programs`);
    return importedPrograms;
  }

  /**
   * Parse XMLTV date format (YYYYMMDDHHMMSS +0000)
   */
  private parseXMLTVDate(dateString: string): Date | null {
    try {
      // XMLTV format: 20230418230000 +0100
      const regex = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2}) ([+-]\d{4})$/;
      const match = dateString.match(regex);
      
      if (!match) return null;
      
      const [, year, month, day, hour, minute, second, tzOffset] = match;
      
      // Parse timezone offset
      const tzHours = parseInt(tzOffset.substring(0, 3)); // +01 or -02
      const tzMinutes = parseInt(tzOffset.substring(0, 1) + tzOffset.substring(3)); // +00 or -30
      
      // Create date in UTC
      const date = new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1, // JS months are 0-based
        parseInt(day),
        parseInt(hour) - tzHours, // Adjust for timezone
        parseInt(minute) - tzMinutes,
        parseInt(second)
      ));
      
      return date;
    } catch (error) {
      console.error('Error parsing XMLTV date:', dateString, error);
      return null;
    }
  }

  /**
   * Update EPG import job status
   */
  private async updateJobStatus(
    jobId: number, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    programsImported: number = 0,
    channelsImported: number = 0,
    errors: string[] = []
  ) {
    return await storage.updateEPGImportJob(jobId, {
      status,
      endTime: new Date(),
      programsImported,
      channelsImported,
      errors: errors.length > 0 ? errors : undefined
    });
  }

  /**
   * Generate a WebGrab+Plus configuration file
   */
  async generateWebGrabConfig(config: WebGrabConfig): Promise<string> {
    // Create WebGrab+Plus configuration XML
    const configXml = `<?xml version="1.0"?>
<settings>
  <filename>guide.xml</filename>
  <mode>${config.update}</mode>
  <postprocess grab="y" run="n">mdb</postprocess>
  <user-agent>Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36</user-agent>
  <logging>on</logging>
  <retry time-out="5">4</retry>
  <timespan>${config.timespan}</timespan>
  <update>f</update>
  <channel update="i" site="${config.siteIni}" site_id="${config.channels[0].siteId}" xmltv_id="${config.channels[0].channelId}">${config.channels[0].displayName}</channel>
</settings>`;

    return configXml;
  }
}

export const epgService = new EPGService();