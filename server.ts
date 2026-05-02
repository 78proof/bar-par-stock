import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// --- Database Logic ---
// We'll use a local JSON file as a fallback if Supabase keys aren't provided
// This ensures the app works "out of the box" for development.
const DB_PATH = path.join(process.cwd(), 'data.json');

async function getLocalDb() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    const initialData = { items: [], categories: [], recipes: [], logs: [], reminders: [], notes: [] };
    await fs.writeFile(DB_PATH, JSON.stringify(initialData));
    return initialData;
  }
}

async function saveLocalDb(data: any) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// ----------------------
// API Routes
// ----------------------

// Items
app.get('/api/items', async (req, res) => {
  const db = await getLocalDb();
  res.json(db.items);
});

app.post('/api/items', async (req, res) => {
  const db = await getLocalDb();
  const newItem = { 
    id: Math.random().toString(36).substr(2, 9), 
    ...req.body, 
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString() 
  };
  db.items.push(newItem);
  await saveLocalDb(db);
  res.json(newItem);
});

app.patch('/api/items/:id', async (req, res) => {
  const db = await getLocalDb();
  const index = db.items.findIndex((i: any) => i.id === req.params.id);
  if (index !== -1) {
    db.items[index] = { ...db.items[index], ...req.body, updatedAt: new Date().toISOString() };
    await saveLocalDb(db);
    res.json(db.items[index]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  const db = await getLocalDb();
  db.items = db.items.filter((i: any) => i.id !== req.params.id);
  await saveLocalDb(db);
  res.json({ success: true });
});

// Categories
app.get('/api/categories', async (req, res) => {
  const db = await getLocalDb();
  res.json(db.categories);
});

app.post('/api/categories', async (req, res) => {
  const db = await getLocalDb();
  const newCat = { id: Math.random().toString(36).substr(2, 9), ...req.body };
  db.categories.push(newCat);
  await saveLocalDb(db);
  res.json(newCat);
});

app.patch('/api/categories/:id', async (req, res) => {
  const db = await getLocalDb();
  const index = db.categories.findIndex((c: any) => c.id === req.params.id);
  if (index !== -1) {
    db.categories[index] = { ...db.categories[index], ...req.body };
    await saveLocalDb(db);
    res.json(db.categories[index]);
  } else {
    res.status(404).send();
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const db = await getLocalDb();
  db.categories = db.categories.filter((c: any) => c.id !== req.params.id);
  await saveLocalDb(db);
  res.json({ success: true });
});

// Logs (with Stock Logic)
app.get('/api/logs', async (req, res) => {
  const db = await getLocalDb();
  res.json(db.logs);
});

app.post('/api/logs', async (req, res) => {
  const db = await getLocalDb();
  const log = { 
    id: Math.random().toString(36).substr(2, 9), 
    ...req.body, 
    createdAt: new Date().toISOString() 
  };
  db.logs.push(log);

  // Update Inventory Stock
  const itemIndex = db.items.findIndex((i: any) => i.id === log.itemId);
  if (itemIndex !== -1) {
    const item = db.items[itemIndex];
    if (log.type === 'count') {
      item.currentStock = log.quantity;
    } else if (log.type === 'delivery') {
      item.currentStock += log.quantity;
    } else if (log.type === 'usage' || log.type === 'sales') {
      item.currentStock -= log.quantity;
    }
    item.updatedAt = new Date().toISOString();
  }

  await saveLocalDb(db);
  res.json(log);
});

app.patch('/api/logs/:id', async (req, res) => {
  const db = await getLocalDb();
  const idx = db.logs.findIndex((l: any) => l.id === req.params.id);
  if (idx !== -1) {
    db.logs[idx] = { ...db.logs[idx], ...req.body };
    await saveLocalDb(db);
    res.json(db.logs[idx]);
  } else {
    res.status(404).send();
  }
});

app.delete('/api/logs/:id', async (req, res) => {
  const db = await getLocalDb();
  const log = db.logs.find((l: any) => l.id === req.params.id);
  if (log) {
    // Revert stock change
    const itemIndex = db.items.findIndex((i: any) => i.id === log.itemId);
    if (itemIndex !== -1) {
      if (log.type === 'delivery') db.items[itemIndex].currentStock -= log.quantity;
      else if (log.type === 'usage' || log.type === 'sales') db.items[itemIndex].currentStock += log.quantity;
    }
  }
  db.logs = db.logs.filter((l: any) => l.id !== req.params.id);
  await saveLocalDb(db);
  res.json({ success: true });
});

// Recipes
app.get('/api/recipes', async (req, res) => {
  const db = await getLocalDb();
  res.json(db.recipes);
});

app.post('/api/recipes', async (req, res) => {
  const db = await getLocalDb();
  const newRecipe = { id: Math.random().toString(36).substr(2, 9), ...req.body };
  db.recipes.push(newRecipe);
  await saveLocalDb(db);
  res.json(newRecipe);
});

app.patch('/api/recipes/:id', async (req, res) => {
  const db = await getLocalDb();
  const idx = db.recipes.findIndex((r: any) => r.id === req.params.id);
  if (idx !== -1) {
    db.recipes[idx] = { ...db.recipes[idx], ...req.body };
    await saveLocalDb(db);
    res.json(db.recipes[idx]);
  } else {
    res.status(404).send();
  }
});

app.delete('/api/recipes/:id', async (req, res) => {
  const db = await getLocalDb();
  db.recipes = db.recipes.filter((r: any) => r.id !== req.params.id);
  await saveLocalDb(db);
  res.json({ success: true });
});

// Reminders & Notes
app.get('/api/reminders', async (req, res) => {
  const db = await getLocalDb();
  res.json(db.reminders);
});

app.post('/api/reminders', async (req, res) => {
  const db = await getLocalDb();
  const reminder = { id: Math.random().toString(36).substr(2, 9), ...req.body, createdAt: new Date().toISOString() };
  db.reminders.push(reminder);
  await saveLocalDb(db);
  res.json(reminder);
});

app.patch('/api/reminders/:id', async (req, res) => {
  const db = await getLocalDb();
  const idx = db.reminders.findIndex((r: any) => r.id === req.params.id);
  if (idx !== -1) {
    db.reminders[idx] = { ...db.reminders[idx], ...req.body };
    await saveLocalDb(db);
    res.json(db.reminders[idx]);
  } else {
    res.status(404).send();
  }
});

app.delete('/api/reminders/:id', async (req, res) => {
  const db = await getLocalDb();
  db.reminders = db.reminders.filter((r: any) => r.id !== req.params.id);
  await saveLocalDb(db);
  res.json({ success: true });
});

app.get('/api/notes', async (req, res) => {
  const db = await getLocalDb();
  res.json(db.notes);
});

app.post('/api/notes', async (req, res) => {
  const db = await getLocalDb();
  const note = { id: Math.random().toString(36).substr(2, 9), ...req.body, createdAt: new Date().toISOString() };
  db.notes.push(note);
  await saveLocalDb(db);
  res.json(note);
});

app.patch('/api/notes/:id', async (req, res) => {
  const db = await getLocalDb();
  const idx = db.notes.findIndex((n: any) => n.id === req.params.id);
  if (idx !== -1) {
    db.notes[idx] = { ...db.notes[idx], ...req.body };
    await saveLocalDb(db);
    res.json(db.notes[idx]);
  } else {
    res.status(404).send();
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  const db = await getLocalDb();
  db.notes = db.notes.filter((n: any) => n.id !== req.params.id);
  await saveLocalDb(db);
  res.json({ success: true });
});

// ----------------------
// Vite Middleware
// ----------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
