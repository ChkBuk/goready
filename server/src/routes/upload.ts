import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { authenticate } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
    }
  },
});

export const uploadRouter = Router();

uploadRouter.use(authenticate);

// POST /api/upload — upload a single image
uploadRouter.post('/', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file provided' });
    return;
  }

  const apiUrl = process.env.API_URL || 'http://localhost:4000';
  const fileUrl = `${apiUrl}/uploads/${req.file.filename}`;

  res.json({
    success: true,
    data: {
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
    },
  });
});
