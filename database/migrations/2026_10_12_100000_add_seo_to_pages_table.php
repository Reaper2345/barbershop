<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| Per-page SEO
|--------------------------------------------------------------------------
| Until now the only editable SEO fields were the site-wide `meta_title` /
| `meta_description` settings, so every CMS page shared one title and one
| description. These columns let each page carry its own pair, edited from a
| modal in /admin/pages and rendered by the public page.
*/

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            // Nullable on purpose: an empty value falls back to the page title
            // and the site-wide setting, so nothing has to be back-filled.
            $table->string('meta_title')->nullable()->after('title');
            $table->text('meta_description')->nullable()->after('meta_title');
        });
    }

    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->dropColumn(['meta_title', 'meta_description']);
        });
    }
};
