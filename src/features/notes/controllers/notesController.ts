import { Request, Response } from 'express';
import { Note } from '../model/Note';
import cloudinary from '../../helpers/cloudinary';

const getNotes = async (req: Request, res: Response) => {
  try {
    const notes = await Note.find();
    return res.status(200).json(notes);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch notes' });
  }
};

const createNote = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    let fileUrl = '';
    if (req.file) {
      const file = await cloudinary.uploader.upload(req.file.path);
      fileUrl = file.secure_url;
    }
    const newNote = new Note({ title, content, fileUrl });
    await newNote.save();
    return res.status(201).json(newNote);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create note' });
  }
};

const updateNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, fileUrl } = req.body;
    const updatedNote = await Note.findByIdAndUpdate(id, { title, content, fileUrl }, { new: true });
    if (!updatedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    return res.status(200).json(updatedNote);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update note' });
  }
};

const deleteNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedNote = await Note.findByIdAndDelete(id);
    if (!deletedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    return res.status(200).json({ message: 'Note deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete note' });
  }
};

export { getNotes, createNote, updateNote, deleteNote };