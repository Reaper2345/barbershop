<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('master_id')->constrained('masters')->cascadeOnDelete();
            // restrict: a service referenced by a booking must not be hard-deleted.
            $table->foreignId('service_id')->constrained('services')->restrictOnDelete();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->enum('status', ['pending', 'confirmed', 'in_progress', 'done', 'cancelled'])
                ->default('pending');
            $table->text('client_comment')->nullable();
            $table->string('photo_path')->nullable();
            // Price agreed by the master once the client's photo/comment is reviewed.
            $table->decimal('master_price_min', 10, 2)->nullable();
            $table->decimal('master_price_max', 10, 2)->nullable();
            $table->decimal('master_price_offer', 10, 2)->nullable();
            $table->text('master_comment')->nullable();
            $table->timestamps();

            $table->index(['master_id', 'starts_at']);
            $table->index(['client_id', 'starts_at']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
