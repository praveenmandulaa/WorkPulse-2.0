<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;



class Employee extends Model
{
    protected $fillable = [
        'user_id',
        'employee_code',
        'department',
        'designation',
        'joining_date',
        'manager_id',
    ];

    protected function casts(): array
    {
        return [
            'joining_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }
    public function attendances(): HasMany
{
    return $this->hasMany(Attendance::class);
}

public function performanceReviews()
{
    return $this->hasMany(PerformanceReview::class);
}

public function performanceMetrics()
{
    return $this->hasMany(PerformanceMetric::class);
}
}
