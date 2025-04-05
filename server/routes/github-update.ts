import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Handles updating the application from GitHub
 * Pulls latest changes and restarts the application
 */
export async function handleGitHubUpdate(req: Request, res: Response) {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized: Admin access required' });
  }

  try {
    // Pull the latest changes from the GitHub repository
    const { stdout: pullOutput, stderr: pullError } = await execAsync('git pull');
    
    if (pullError && !pullOutput.includes('Already up to date')) {
      console.error('Git pull error:', pullError);
      return res.status(500).json({ error: 'Failed to pull latest changes', details: pullError });
    }
    
    if (pullOutput.includes('Already up to date')) {
      return res.json({ message: 'Application is already up to date', updated: false });
    }
    
    // Install any new dependencies
    const { stdout: npmOutput, stderr: npmError } = await execAsync('npm install');
    
    if (npmError) {
      console.error('npm install error:', npmError);
      return res.status(500).json({ error: 'Failed to install dependencies', details: npmError });
    }
    
    // For production, you might want to run a build step here
    // await execAsync('npm run build');
    
    return res.json({ 
      message: 'Successfully updated application from GitHub. Application will reload shortly.',
      updated: true,
      pullOutput
    });
    
  } catch (error) {
    console.error('GitHub update error:', error);
    return res.status(500).json({ 
      error: 'Failed to update from GitHub', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}