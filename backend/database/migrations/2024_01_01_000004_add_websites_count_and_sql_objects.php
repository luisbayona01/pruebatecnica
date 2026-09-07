<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Demostración de competencias SQL (triggers + stored procedures).
     *
     * 1) Columna desnormalizada `categories.websites_count` mantenida por
     *    triggers, para evitar COUNT(*) en cada consulta del listado y del
     *    dashboard (lista solo de lectura, de alta frecuencia).
     *
     * 2) Procedimiento almacenado `GetDashboardStats` que calcula las
     *    estadísticas del dashboard en un único viaje a la base de datos.
     */
    public function up(): void
    {
        // Idempotencia: migrate:fresh no ejecuta down(), por lo que estas
        // rutinas podrían persistir. Se eliminan antes de recrearse.
        DB::unprepared('DROP PROCEDURE IF EXISTS GetDashboardStats');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_websites_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_websites_after_delete');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_websites_after_update');

        // 1. Columna desnormalizada (se rellena automáticamente por el trigger).
        DB::statement('ALTER TABLE categories ADD websites_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER name');
        DB::statement('UPDATE categories SET websites_count = (SELECT COUNT(*) FROM websites WHERE websites.category_id = categories.id)');

        // 2. Triggers para mantener el contador ante INSERT / DELETE / UPDATE.
        DB::unprepared(<<<'SQL'
CREATE TRIGGER trg_websites_after_insert
AFTER INSERT ON websites
FOR EACH ROW
BEGIN
    UPDATE categories SET websites_count = websites_count + 1 WHERE id = NEW.category_id;
END
SQL);

        DB::unprepared(<<<'SQL'
CREATE TRIGGER trg_websites_after_delete
AFTER DELETE ON websites
FOR EACH ROW
BEGIN
    UPDATE categories SET websites_count = websites_count - 1 WHERE id = OLD.category_id;
END
SQL);

        DB::unprepared(<<<'SQL'
CREATE TRIGGER trg_websites_after_update
AFTER UPDATE ON websites
FOR EACH ROW
BEGIN
    IF OLD.category_id <> NEW.category_id THEN
        UPDATE categories SET websites_count = websites_count - 1 WHERE id = OLD.category_id;
        UPDATE categories SET websites_count = websites_count + 1 WHERE id = NEW.category_id;
    END IF;
END
SQL);

        // 3. Procedimiento almacenado para las estadísticas del dashboard.
        //    Acepta user_id para aislar los datos por usuario (multi-tenancy).
        DB::unprepared(<<<'SQL'
CREATE PROCEDURE GetDashboardStats(IN p_user_id INT)
BEGIN
    SELECT
        (SELECT COUNT(*) FROM websites WHERE user_id = p_user_id)               AS total_websites,
        (SELECT COUNT(*) FROM categories WHERE user_id = p_user_id)             AS total_categories,
        (SELECT COUNT(*) FROM websites WHERE user_id = p_user_id AND is_favorite = 1) AS total_favorites,
        (SELECT c.name FROM categories c WHERE c.user_id = p_user_id
            ORDER BY c.websites_count DESC, c.name ASC
            LIMIT 1)                                 AS top_category_name,
        (SELECT c.websites_count FROM categories c WHERE c.user_id = p_user_id
            ORDER BY c.websites_count DESC, c.name ASC
            LIMIT 1)                                 AS top_category_count;
END
SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP PROCEDURE IF EXISTS GetDashboardStats');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_websites_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_websites_after_delete');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_websites_after_update');
        DB::statement('ALTER TABLE categories DROP COLUMN websites_count');
    }
};