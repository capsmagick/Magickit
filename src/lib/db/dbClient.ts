import { MongoClient } from 'mongodb';
import { MONGODB_URI } from '$env/static/private';

const client = new MongoClient(MONGODB_URI);
const db = client.db();

// Initialize database on first import
let initialized = false;

async function initializeOnce() {
  if (!initialized) {
    try {
      // Import here to avoid circular dependencies
      const { initializeDatabase } = await import('./init');
      await initializeDatabase();
      initialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Don't throw here to avoid breaking the app startup
    }
  }
}

// Initialize in the background
initializeOnce();

export default db;