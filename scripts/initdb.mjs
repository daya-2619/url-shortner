import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function initDb() {
  const sql = neon(process.env.DATABASE_URL);

  console.log('Creating url_mapping table...');
  await sql`
    CREATE TABLE IF NOT EXISTS url_mapping (
      short_url VARCHAR(10) PRIMARY KEY,
      original_url TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log('Creating analytics table...');
  await sql`
    CREATE TABLE IF NOT EXISTS analytics (
      short_url VARCHAR(10) PRIMARY KEY REFERENCES url_mapping(short_url) ON DELETE CASCADE,
      click_count INTEGER DEFAULT 0,
      last_accessed TIMESTAMP WITH TIME ZONE
    );
  `;

  console.log('Database initialized successfully.');
}

initDb().catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
