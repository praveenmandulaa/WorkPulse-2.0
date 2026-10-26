<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->restrictOnDelete();

            $table->date('attendance_date');

            $table->dateTime('check_in_at')->nullable();
            $table->dateTime('check_out_at')->nullable();

            $table->unsignedInteger('worked_minutes')->default(0);
            $table->unsignedInteger('late_minutes')->default(0);

            $table->enum('status', [
                'present',
                'late',
                'absent',
                'leave',
            ])->default('present');

            $table->timestamps();

            $table->unique([
                'employee_id',
                'attendance_date',
            ]);

            $table->index('attendance_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
