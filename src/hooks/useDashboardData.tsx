import { useState, useEffect } from 'react';
import { Reminder, Note } from '../types/index';

export const useDashboardData = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [remRes, notesRes] = await Promise.all([
        fetch('/api/reminders'),
        fetch('/api/notes')
      ]);
      const remData = await remRes.json();
      const notesData = await notesRes.json();
      setReminders(remData);
      setNotes(notesData);
    } catch (e) {
      console.error("Failed to fetch dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const addReminder = async (text: string) => {
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, completed: false })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Add reminder error:", error);
    }
  };

  const toggleReminder = async (id: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Toggle reminder error:", error);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Delete reminder error:", error);
    }
  };

  const addNote = async (content: string, title?: string) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title: title || '' })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Add note error:", error);
    }
  };

  const updateNote = async (id: string, content: string, title?: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title: title || '' })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Update note error:", error);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Delete note error:", error);
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
