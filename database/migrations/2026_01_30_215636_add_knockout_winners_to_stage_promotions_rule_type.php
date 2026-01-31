<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    // For SQLite, we need to recreate the table to modify the enum constraint
    if (DB::connection()->getDriverName() === 'sqlite') {
      DB::statement("
                CREATE TABLE stage_promotions_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    stage_id INTEGER NOT NULL,
                    next_stage_id INTEGER NOT NULL,
                    rule_type TEXT CHECK(rule_type IN ('top_n', 'top_per_group', 'points_threshold', 'knockout_winners', 'custom')) DEFAULT 'top_n' NOT NULL,
                    rule_config TEXT,
                    created_at DATETIME,
                    updated_at DATETIME,
                    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
                    FOREIGN KEY (next_stage_id) REFERENCES stages(id) ON DELETE CASCADE
                )
            ");

      // Copy existing data
      DB::statement('
                INSERT INTO stage_promotions_new (id, stage_id, next_stage_id, rule_type, rule_config, created_at, updated_at)
                SELECT id, stage_id, next_stage_id, rule_type, rule_config, created_at, updated_at
                FROM stage_promotions
            ');

      // Drop old table and rename new one
      DB::statement('DROP TABLE stage_promotions');
      DB::statement('ALTER TABLE stage_promotions_new RENAME TO stage_promotions');

      // Recreate index
      DB::statement('CREATE INDEX stage_promotions_stage_id_index ON stage_promotions(stage_id)');
    } elseif (DB::connection()->getDriverName() === 'pgsql') {
      // For PostgreSQL, use ALTER COLUMN with SET DATA TYPE and SET DEFAULT
      DB::statement("ALTER TABLE stage_promotions ALTER COLUMN rule_type TYPE TEXT USING rule_type::TEXT");
      DB::statement("ALTER TABLE stage_promotions ALTER COLUMN rule_type SET DEFAULT 'top_n'");
      DB::statement("ALTER TABLE stage_promotions ADD CONSTRAINT rule_type_check CHECK (rule_type IN ('top_n', 'top_per_group', 'points_threshold', 'knockout_winners', 'custom'))");
    } else {
      // For MySQL
      DB::statement("ALTER TABLE stage_promotions MODIFY COLUMN rule_type ENUM('top_n', 'top_per_group', 'points_threshold', 'knockout_winners', 'custom') DEFAULT 'top_n'");
    }
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    // For SQLite, we need to recreate the table to modify the enum constraint
    if (DB::connection()->getDriverName() === 'sqlite') {
      DB::statement("
                CREATE TABLE stage_promotions_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    stage_id INTEGER NOT NULL,
                    next_stage_id INTEGER NOT NULL,
                    rule_type TEXT CHECK(rule_type IN ('top_n', 'top_per_group', 'points_threshold', 'custom')) DEFAULT 'top_n' NOT NULL,
                    rule_config TEXT,
                    created_at DATETIME,
                    updated_at DATETIME,
                    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
                    FOREIGN KEY (next_stage_id) REFERENCES stages(id) ON DELETE CASCADE
                )
            ");

      // Copy existing data (excluding knockout_winners)
      DB::statement("
                INSERT INTO stage_promotions_new (id, stage_id, next_stage_id, rule_type, rule_config, created_at, updated_at)
                SELECT id, stage_id, next_stage_id, rule_type, rule_config, created_at, updated_at
                FROM stage_promotions
                WHERE rule_type != 'knockout_winners'
            ");

      // Drop old table and rename new one
      DB::statement('DROP TABLE stage_promotions');
      DB::statement('ALTER TABLE stage_promotions_new RENAME TO stage_promotions');

      // Recreate index
      DB::statement('CREATE INDEX stage_promotions_stage_id_index ON stage_promotions(stage_id)');
    } elseif (DB::connection()->getDriverName() === 'pgsql') {
      // For PostgreSQL, revert the changes
      DB::statement("ALTER TABLE stage_promotions DROP CONSTRAINT rule_type_check");
      DB::statement("ALTER TABLE stage_promotions ALTER COLUMN rule_type DROP DEFAULT");
      DB::statement("ALTER TABLE stage_promotions ALTER COLUMN rule_type TYPE TEXT USING rule_type::TEXT");
    } else {
      // For MySQL
      DB::statement("ALTER TABLE stage_promotions MODIFY COLUMN rule_type ENUM('top_n', 'top_per_group', 'points_threshold', 'custom') DEFAULT 'top_n'");
    }
  }
};
