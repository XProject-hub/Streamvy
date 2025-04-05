import express from 'express';
import { handleGitHubUpdate } from './github-update';

const router = express.Router();

// GitHub update route
router.post('/update-from-github', handleGitHubUpdate);

export default router;