<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceReview extends Model
{
    protected $fillable = [
        'employee_id',
        'reviewer_id',
        'review_period',
        'quality_rating',
        'communication_rating',
        'teamwork_rating',
        'initiative_rating',
        'manager_score',
        'strengths',
        'improvements',
        'feedback',
        'status',
        'finalized_at',
    ];

    protected function casts(): array
    {
        return [
            'review_period' => 'date:Y-m-d',
            'manager_score' => 'decimal:2',
            'finalized_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
