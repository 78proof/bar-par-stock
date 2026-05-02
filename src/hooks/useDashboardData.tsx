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
import { handleFirestoreError } from '../lib/firestoreUtils';

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

    // Start with a default or guest UID if not logged in
    const currentUid = auth.currentUser?.uid || 'guest-user';

    const setupListeners = (userId: string) => {
      const remindersQuery = query(
        collection(db, 'reminders'), 
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const unsubscribeReminders = onSnapshot(remindersQuery, (snapshot) => {
        setReminders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder)));
      }, (error) => console.error("Firestore Reminders sync error:", error));

      const notesQuery = query(
        collection(db, 'notes'), 
        where('createdBy', '==', userId),
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

    let stopListeners = setupListeners(currentUid);

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // If auth state changes, restart listeners for the new user
      if (stopListeners) stopListeners();
      stopListeners = setupListeners(user?.uid || 'guest-user');
    });

    return () => {
      if (stopListeners) stopListeners();
      unsubscribeAuth();
    };
  }, []);

  const addReminder = async (text: string) => {
    try {
      await addDoc(collection(db, 'reminders'), {
        text,
        completed: false,
        createdBy: auth.currentUser?.uid || 'guest-user',
        createdAt: serverTimestamp(),
      });
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
      await addDoc(collection(db, 'notes'), {
        content,
        title: title || '',
        createdBy: auth.currentUser?.uid || 'guest-user',
        createdAt: serverTimestamp(),
      });
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
