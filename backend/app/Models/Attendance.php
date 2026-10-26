<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;



class Attendance extends Model
{
    protected $fillable = [
        'employee_id',
        'attendance_date',
        'check_in_at',
        'check_out_at',
        'worked_minutes',
        'late_minutes',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'attendance_date' => 'date:Y-m-d',
            'check_in_at' => 'datetime',
            'check_out_at' => 'datetime',
            'worked_minutes' => 'integer',
            'late_minutes' => 'integer',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}