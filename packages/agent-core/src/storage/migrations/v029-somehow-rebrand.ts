import type { Database } from 'better-sqlite3';
import type { Migration } from './index.js';

/**
 * SomeHow rebrand: migrate built-in provider id (`somehow-ai` → `somehow-ai`),
 * model ids, credential JSON `type`, and rename the free-tier credits cache table.
 * Ensures existing installs keep their connection and credit cache after upgrade.
 */
export const migration: Migration = {
  version: 29,
  up: (db: Database) => {
    const legacyCredits = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='somehow_ai_credits'")
      .get();
    if (legacyCredits) {
      db.exec('ALTER TABLE somehow_ai_credits RENAME TO somehow_ai_credits');
    }

    db.exec(`
      UPDATE providers
      SET credentials_data = replace(credentials_data, '"type":"somehow-ai"', '"type":"somehow-ai"')
      WHERE provider_id = 'somehow-ai';

      UPDATE providers
      SET selected_model_id = replace(
        selected_model_id,
        'somehow-ai/somehow-free',
        'somehow-ai/somehow-free'
      )
      WHERE provider_id = 'somehow-ai';

      UPDATE providers
      SET selected_model_id = replace(selected_model_id, 'somehow-ai/', 'somehow-ai/')
      WHERE selected_model_id LIKE 'somehow-ai/%';

      UPDATE provider_meta
      SET active_provider_id = 'somehow-ai'
      WHERE active_provider_id = 'somehow-ai';

      UPDATE providers
      SET provider_id = 'somehow-ai'
      WHERE provider_id = 'somehow-ai';
    `);
  },
};
