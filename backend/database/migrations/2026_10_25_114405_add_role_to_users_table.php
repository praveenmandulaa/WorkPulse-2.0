
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role', 20)
                    ->default('employee')
                    ->after('password');
            });
        }
    }

    public function down(): void
    {
        // Do not drop the role column here.
        // It is also managed by an earlier migration.
    }
};
