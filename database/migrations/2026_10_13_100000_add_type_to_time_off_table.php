<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds the absence TYPE to the existing day-per-row table.
     *
     * Kept additive on purpose: `time_off` stores one row per blocked day with a
     * DB-enforced unique(master_id, date), and SlotService checks availability
     * with a per-day `whereDate('date', ...)`. A range model (date_from/date_to)
     * would have required making `date` nullable to neutralise that unique index
     * and would have left a redundant `date` column behind, so the day-per-row
     * shape is preserved — only the discriminator the quick actions need is new.
     *
     * Existing rows are marked 'day_off', which is what they were: a single
     * blocked day.
     */
    public function up(): void
    {
        Schema::table('time_off', function (Blueprint $table) {
            $table->string('type', 20)->default('day_off')->after('date');
        });
    }

    public function down(): void
    {
        Schema::table('time_off', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
