<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_service', function (Blueprint $table) {
            $table->id();
            $table->foreignId('master_id')->constrained('masters')->cascadeOnDelete();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            // Per-master overrides: NULL means "inherit the service defaults".
            $table->decimal('price_min', 10, 2)->nullable();
            $table->decimal('price_max', 10, 2)->nullable();
            $table->integer('duration_min')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['master_id', 'service_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_service');
    }
};
