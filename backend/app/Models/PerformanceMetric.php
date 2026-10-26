<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceMetric extends Model
{
    protected $fillable = [
        'employee_id',
        'period',
        'total_tasks',
        'completed_tasks',
        'on_time_tasks',
        'working_days',
        'present_days',
        'late_days',
        'task_score',
        'attendance_score',
        'punctuality_score',
        'manager_score',
        'overall_score',
        'calculation_version',
        'calculated_at',
    ];

    protected function casts(): array
    {
        return [
            'period' => 'date:Y-m-d',
            'task_score' => 'decimal:2',
            'attendance_score' => 'decimal:2',
            'punctuality_score' => 'decimal:2',
            'manager_score' => 'decimal:2',
            'overall_score' => 'decimal:2',
            'calculated_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
