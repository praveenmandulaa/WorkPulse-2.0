
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->restrictOnDelete();

            $table->string('employee_code', 30)->unique();
            $table->string('department', 100);
            $table->string('designation', 100);
            $table->date('joining_date');
            $table->foreignId('manager_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index('department');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
