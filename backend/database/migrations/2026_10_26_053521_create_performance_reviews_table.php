<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_reviews', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->restrictOnDelete();

            $table->foreignId('reviewer_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->date('review_period');

            $table->unsignedTinyInteger('quality_rating');
            $table->unsignedTinyInteger('communication_rating');
            $table->unsignedTinyInteger('teamwork_rating');
            $table->unsignedTinyInteger('initiative_rating');

            $table->decimal('manager_score', 5, 2)->nullable();

            $table->text('strengths')->nullable();
            $table->text('improvements')->nullable();
            $table->text('feedback')->nullable();

            $table->enum('status', [
                'draft',
                'finalized'
            ])->default('draft');

            $table->timestamp('finalized_at')->nullable();

            $table->timestamps();

            $table->unique([
                'employee_id',
                'review_period'
            ], 'unique_employee_review_period');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_reviews');
    }
};
