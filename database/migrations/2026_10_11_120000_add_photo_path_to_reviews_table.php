<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            // Optional client-supplied photo, stored on the `public` disk under
            // reviews/ and served through /storage/reviews/…
            $table->string('photo_path')->nullable()->after('text');
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn('photo_path');
        });
    }
};
