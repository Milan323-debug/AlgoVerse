import express from 'express';
import { renderVideo } from '../controllers/videoController.js';

const router = express.Router();

// Route to trigger server-side video rendering
router.post('/render', renderVideo);

export default router;
