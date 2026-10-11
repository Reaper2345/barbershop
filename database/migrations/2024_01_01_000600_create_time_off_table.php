<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Table is named `time_off` (singular, as specified) and therefore has to be
     * declared explicitly on the TimeOff model.
     */
    public function up(): void
    {
        Schema::create('time_off', function (Blueprint $table) {
            $table->id();
            $table->foreignId('master_id')->constrained('masters')->cascadeOnDelete();
            $table->date('date');
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->unique(['master_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_off');
    }
};
