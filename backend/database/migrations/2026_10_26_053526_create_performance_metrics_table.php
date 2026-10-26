<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_metrics', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->restrictOnDelete();

            $table->date('period');

            $table->unsignedInteger('total_tasks')->default(0);
            $table->unsignedInteger('completed_tasks')->default(0);
            $table->unsignedInteger('on_time_tasks')->default(0);

            $table->unsignedInteger('working_days')->default(0);
            $table->unsignedInteger('present_days')->default(0);
            $table->unsignedInteger('late_days')->default(0);

            $table->decimal('task_score', 5, 2)->nullable();
            $table->decimal('attendance_score', 5, 2)->nullable();
            $table->decimal('punctuality_score', 5, 2)->nullable();
            $table->decimal('manager_score', 5, 2)->nullable();

            $table->decimal('overall_score', 5, 2)->nullable();

            $table->string('calculation_version', 30)
                ->default('v1');

            $table->timestamp('calculated_at')->nullable();

            $table->timestamps();

            $table->unique([
                'employee_id',
                'period'
            ], 'unique_employee_metric_period');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_metrics');
    }
};
