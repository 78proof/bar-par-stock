import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp,
  where
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { OperationType } from '../types';
import { handleFirestoreError, sanitizeData, getCurrentUserId } from '../lib/firestoreUtils';

export interface Reminder {
  id: string;
  text: string;
  completed: boolean;
  createdBy: string;
  createdAt: any;
}

export interface Note {
  id: string;
  title?: string;
  content: string;
  createdBy: string;
  createdAt: any;
}

export const useDashboardData = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    const setupListeners = () => {
      const remindersQuery = query(
        collection(db, 'reminders'), 
        orderBy('createdAt', 'desc')
      );
      const unsubscribeReminders = onSnapshot(remindersQuery, (snapshot) => {
        setReminders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder)));
      }, (error) => console.error("Firestore Reminders sync error:", error));

      const notesQuery = query(
        collection(db, 'notes'), 
        orderBy('createdAt', 'desc')
      );
      const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
        setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)));
        setLoading(false);
      }, (error) => console.error("Firestore Notes sync error:", error));

      return () => {
        unsubscribeReminders();
        unsubscribeNotes();
      };
    };

    const stopListeners = setupListeners();

    return () => {
      if (stopListeners) stopListeners();
    };
  }, []);

  const addReminder = async (text: string) => {
    try {
      if (!db) return;
      const uid = getCurrentUserId();

      const payload = sanitizeData({
        text: text || '',
        completed: false,
        createdBy: uid,
        createdAt: serverTimestamp(),
      });
      
      console.log("[DEBUG] addReminder payload:", payload);
      await addDoc(collection(db, 'reminders'), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reminders');
    }
  };

  const toggleReminder = async (id: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, 'reminders', id), { completed });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reminders/${id}`);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reminders', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reminders/${id}`);
    }
  };

  const addNote = async (content: string, title?: string) => {
    try {
      if (!db) return;
      const uid = getCurrentUserId();

      const payload = sanitizeData({
        content: content || '',
        title: title || '',
        createdBy: uid,
        createdAt: serverTimestamp(),
      });
      
      console.log("[DEBUG] addNote payload:", payload);
      await addDoc(collection(db, 'notes'), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notes');
    }
  };

  const updateNote = async (id: string, content: string, title?: string) => {
    try {
      await updateDoc(doc(db, 'notes', id), { 
        content, 
        title: title || '',
        updatedAt: serverTimestamp() 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notes/${id}`);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notes/${id}`);
    }
  };

  return {
    reminders,
    notes,
    loading,
    addReminder,
    toggleReminder,
    deleteReminder,
    addNote,
    updateNote,
    deleteNote
  };
};
