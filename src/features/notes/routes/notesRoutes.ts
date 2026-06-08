import express from 'express';
import { getNotes, createNote, updateNote, deleteNote } from '../controllers/notesController';
import multer from 'multer';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

router.get('/', getNotes);
router.post('/', upload.single('file'), createNote);
router.patch('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;