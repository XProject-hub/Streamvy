import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { storage } from '../storage';
import { epgService } from '../epg-service';
import axios from 'axios';

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);

export interface WebGrabSiteConfig {
  id: string;
  name: string;
  url: string;
  channels: Array<{
    id: string;
    name: string;
    xmltvId: string;
  }>;
}

export interface WebGrabConfig {
  filename: string;
  mode: 'i' | 'g' | 'f'; // incremental, grab all, forced
  timespan: number;
  siteIniConfigs: WebGrabSiteConfig[];
  selectedChannels: Array<{
    channelId: number;
    displayName: string;
    siteId: string;
    siteIniId: string;
  }>;
}

/**
 * Service for handling WebGrab+ operations
 */
export class WebGrabService {
  private webgrabConfigDir = path.join(process.cwd(), 'webgrab-config');
  private webgrabOutputDir = path.join(process.cwd(), 'webgrab-output');
  private siteiniDir = path.join(this.webgrabConfigDir, 'siteini.pack');
  
  constructor() {
    this.ensureDirectoriesExist();
  }
  
  /**
   * Initialize WebGrab+ configuration directories
   */
  private async ensureDirectoriesExist() {
    try {
      // Create main directories if they don't exist
      if (!await existsAsync(this.webgrabConfigDir)) {
        await mkdirAsync(this.webgrabConfigDir, { recursive: true });
      }
      
      if (!await existsAsync(this.webgrabOutputDir)) {
        await mkdirAsync(this.webgrabOutputDir, { recursive: true });
      }
      
      if (!await existsAsync(this.siteiniDir)) {
        await mkdirAsync(this.siteiniDir, { recursive: true });
      }
      
      console.log('WebGrab+ directories initialized');
    } catch (error) {
      console.error('Error creating WebGrab+ directories:', error);
    }
  }
  
  /**
   * Get available WebGrab+ site configurations
   */
  async getAvailableSiteConfigs(): Promise<WebGrabSiteConfig[]> {
    try {
      // For now, return a list of common site configurations
      // In a production environment, this would scan the siteini.pack directory
      // or fetch from an online repository
      
      return [
        {
          id: 'tvguide.com',
          name: 'TV Guide (US)',
          url: 'http://tvguide.com',
          channels: [
            { id: '1', name: 'NBC', xmltvId: 'NBC.com' },
            { id: '2', name: 'CBS', xmltvId: 'CBS.com' },
            { id: '3', name: 'ABC', xmltvId: 'ABC.com' }
          ]
        },
        {
          id: 'horizon.tv',
          name: 'Horizon TV (Europe)',
          url: 'http://horizon.tv',
          channels: [
            { id: '1', name: 'BBC One', xmltvId: 'BBC1.uk' },
            { id: '2', name: 'BBC Two', xmltvId: 'BBC2.uk' },
            { id: '3', name: 'ITV', xmltvId: 'ITV.uk' }
          ]
        },
        {
          id: 'dsmart.com.tr',
          name: 'D-Smart (Turkey)',
          url: 'https://www.dsmart.com.tr',
          channels: [
            { id: '1', name: 'D-Smart Spor 1', xmltvId: 'DSport1.tr' },
            { id: '2', name: 'D-Smart Spor 2', xmltvId: 'DSport2.tr' },
            { id: '3', name: 'D-Smart Belgesel', xmltvId: 'DDoc.tr' }
          ]
        },
        {
          id: 'digiturk.com.tr',
          name: 'Digiturk (Turkey)',
          url: 'https://www.digiturk.com.tr',
          channels: [
            { id: '1', name: 'beIN SPORTS 1', xmltvId: 'beINSPORTS1.tr' },
            { id: '2', name: 'beIN SPORTS 2', xmltvId: 'beINSPORTS2.tr' },
            { id: '3', name: 'beIN SPORTS 3', xmltvId: 'beINSPORTS3.tr' }
          ]
        }
      ];
    } catch (error) {
      console.error('Error getting WebGrab+ site configurations:', error);
      return [];
    }
  }
  
  /**
   * Generate WebGrab+ configuration file for a source
   */
  async generateConfig(config: WebGrabConfig): Promise<string> {
    try {
      const configXml = `<?xml version="1.0"?>
<settings>
  <filename>${config.filename}</filename>
  <mode>${config.mode}</mode>
  <postprocess grab="y" run="n">mdb</postprocess>
  <user-agent>Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36</user-agent>
  <logging>on</logging>
  <retry time-out="5">4</retry>
  <timespan>${config.timespan}</timespan>
  <update>f</update>
  ${config.selectedChannels.map(channel => 
    `<channel update="i" site="${channel.siteIniId}" site_id="${channel.siteId}" xmltv_id="${channel.channelId}">${channel.displayName}</channel>`
  ).join('\n  ')}
</settings>`;
      
      const configPath = path.join(this.webgrabConfigDir, 'WebGrab++.config.xml');
      await writeFileAsync(configPath, configXml, 'utf8');
      
      return configPath;
    } catch (error) {
      console.error('Error generating WebGrab+ configuration:', error);
      throw new Error('Failed to generate WebGrab+ configuration');
    }
  }
  
  /**
   * Download a site.ini file from a URL
   */
  async downloadSiteIni(siteId: string, url: string): Promise<string> {
    try {
      const response = await axios.get(url);
      const iniContent = response.data;
      
      const siteDir = path.join(this.siteiniDir, siteId);
      if (!await existsAsync(siteDir)) {
        await mkdirAsync(siteDir, { recursive: true });
      }
      
      const iniPath = path.join(siteDir, `${siteId}.ini`);
      await writeFileAsync(iniPath, iniContent, 'utf8');
      
      return iniPath;
    } catch (error) {
      console.error(`Error downloading site.ini for ${siteId}:`, error);
      throw new Error(`Failed to download site.ini for ${siteId}`);
    }
  }
  
  /**
   * Execute WebGrab+ to grab EPG data
   */
  async executeWebGrab(sourceId: number, configPath: string): Promise<{
    success: boolean;
    message: string;
    outputFile?: string;
  }> {
    try {
      // In a real implementation, we would call the WebGrab+ executable
      // For this example, we'll simulate the process
      
      console.log(`Executing WebGrab+ for EPG source ${sourceId} using config: ${configPath}`);
      
      // Create a simulated import job
      const job = await storage.createEPGImportJob({
        epgSourceId: sourceId,
        startTime: new Date(),
        status: 'processing',
      });
      
      // Simulate the WebGrab+ execution
      console.log('Simulating WebGrab+ execution...');
      
      // In a real implementation, this would be:
      // await execAsync('path/to/WebGrab+Plus.exe', { cwd: this.webgrabConfigDir });
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a sample XMLTV output file
      const outputFile = path.join(this.webgrabOutputDir, 'guide.xml');
      const sampleXML = await this.generateSampleXMLTV(sourceId);
      await writeFileAsync(outputFile, sampleXML, 'utf8');
      
      // Process the generated XMLTV file using the existing EPG service
      const source = await storage.getEPGSource(sourceId);
      if (!source) {
        throw new Error('EPG source not found');
      }
      
      // Update the source URL to point to our local file
      await storage.updateEPGSource(sourceId, {
        url: `file://${outputFile}`,
        lastUpdate: new Date()
      });
      
      // Now process the EPG data using the existing service
      const result = await epgService.fetchAndProcessEPG(sourceId);
      
      if (result.success) {
        await storage.updateEPGImportJob(job.id, {
          status: 'completed',
          endTime: new Date(),
          programsImported: result.programsImported || 0,
          channelsImported: result.channelsImported || 0
        });
        
        return {
          success: true,
          message: `Successfully grabbed and processed EPG data: ${result.message}`,
          outputFile
        };
      } else {
        await storage.updateEPGImportJob(job.id, {
          status: 'failed',
          endTime: new Date(),
          errors: [result.message]
        });
        
        return {
          success: false,
          message: `Failed to process grabbed EPG data: ${result.message}`
        };
      }
    } catch (error) {
      console.error('Error executing WebGrab+:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error executing WebGrab+'
      };
    }
  }
  
  /**
   * Generate a sample XMLTV file for simulation purposes
   * In a real implementation, this would be generated by WebGrab+
   */
  private async generateSampleXMLTV(sourceId: number): Promise<string> {
    const source = await storage.getEPGSource(sourceId);
    if (!source) {
      throw new Error('EPG source not found');
    }
    
    // Get all channels for this source
    const channels = await storage.getChannels();
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const formatDate = (date: Date): string => {
      return date.toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d+Z$/, ' +0000');
    };
    
    // Generate sample XMLTV content
    const xmltvContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE tv SYSTEM "xmltv.dtd">
<tv generator-info-name="WebGrab+Plus/w MDB &amp; REX Postprocess -- version V3.3.0.0 -- Jan van Straaten" generator-info-url="http://www.webgrabplus.com">
  ${channels.slice(0, 5).map(channel => `<channel id="${channel.id}">
    <display-name>${channel.name}</display-name>
  </channel>`).join('\n  ')}
  
  ${channels.slice(0, 5).flatMap(channel => {
    const programs = [];
    for (let i = 0; i < 10; i++) {
      const startTime = new Date(now);
      startTime.setHours(now.getHours() + i * 2);
      
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 2);
      
      programs.push(`<programme start="${formatDate(startTime)}" stop="${formatDate(endTime)}" channel="${channel.id}">
    <title>${source.name} Sample Program ${i + 1}</title>
    <desc>This is a sample program description for simulation purposes. This program would normally have real content from ${source.name}.</desc>
    <category>Entertainment</category>
    <episode-num system="xmltv_ns">1.${i}.0/1</episode-num>
  </programme>`);
    }
    return programs;
  }).join('\n  ')}
</tv>`;

    return xmltvContent;
  }
}

export const webgrabService = new WebGrabService();