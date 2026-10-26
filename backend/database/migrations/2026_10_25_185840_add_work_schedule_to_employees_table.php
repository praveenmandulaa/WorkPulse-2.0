<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->time('shift_start')->default('09:30:00');
            $table->time('shift_end')->default('18:30:00');
            $table->string('timezone', 64)->default('Asia/Kolkata');
            $table->unsignedSmallInteger('grace_minutes')->default(10);
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'shift_start',
                'shift_end',
                'timezone',
                'grace_minutes',
            ]);
        });
    }
};
