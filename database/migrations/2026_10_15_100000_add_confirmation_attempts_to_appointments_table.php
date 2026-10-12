<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Client-side code confirmation needs two extra facts on the booking:
     *
     *   confirmation_attempts — wrong guesses so far (5 and the code is dead),
     *   confirmation_sent_at  — when the code went out, which drives both the
     *                          15-minute expiry and the 60-second resend
     *                          cooldown.
     *
     * `confirmation_code` itself already exists.
     */
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->unsignedTinyInteger('confirmation_attempts')->default(0)->after('confirmation_code');
            $table->timestamp('confirmation_sent_at')->nullable()->after('confirmation_attempts');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['confirmation_attempts', 'confirmation_sent_at']);
        });
    }
};
