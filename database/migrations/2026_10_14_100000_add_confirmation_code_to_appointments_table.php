<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The code the barbershop receives by email and quotes when confirming a
     * booking by phone or in the panel.
     *
     * Nullable on purpose: bookings created before this column existed (and any
     * booking whose email never went out) simply have no code, and the master
     * still confirms them manually with a price range or an exact offer.
     */
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('confirmation_code', 8)->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn('confirmation_code');
        });
    }
};
