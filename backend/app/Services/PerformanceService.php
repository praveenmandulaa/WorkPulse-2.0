<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PerformanceService
{
    public function calculate(Employee $employee, string $month): array
    {
        $start = Carbon::createFromFormat('!Y-m', $month)
            ->startOfMonth();

        $end = $start->copy()->endOfMonth();

        // Tasks are assigned to users, not employee records.
        // v1 cohort: tasks whose due date falls in this month.
        $tasks = Task::query()
            ->where('assigned_to', $employee->user_id)
            ->whereBetween('due_date', [
                $start->toDateString(),
                $end->toDateString()
            ])
            ->get();

        $totalTasks = $tasks->count();

        $completedTasks = $tasks->filter(function ($task) use ($end) {
            return $task->completed_at !== null
                && Carbon::parse($task->completed_at)->lte($end);
        });

        $completedCount = $completedTasks->count();

        $onTimeCount = $completedTasks->filter(function ($task) {
            return Carbon::parse($task->completed_at)
                ->lte(Carbon::parse($task->due_date)->endOfDay());
        })->count();

        $taskScore = $totalTasks > 0
            ? round(($completedCount / $totalTasks) * 100, 2)
            : null;

        $deliveryScore = $completedCount > 0
            ? round(($onTimeCount / $completedCount) * 100, 2)
            : null;

        $attendance = DB::table('attendances')
            ->where('employee_id', $employee->id)
            ->whereBetween('attendance_date', [
                $start->toDateString(),
                $end->toDateString()
            ])
            ->get();

        $presentDays = $attendance
            ->whereIn('status', ['present', 'late'])
            ->count();

        $lateDays = $attendance
            ->where('status', 'late')
            ->count();

        $absentDays = $attendance
            ->where('status', 'absent')
            ->count();

        $leaveDays = $attendance
            ->where('status', 'leave')
            ->count();

        // Manager reviews are included only after finalization.
        $review = DB::table('performance_reviews')
            ->where('employee_id', $employee->id)
            ->whereDate('review_period', $start->toDateString())
            ->where('status', 'finalized')
            ->first();

        $managerScore = $review
            ? (float) $review->manager_score
            : null;

        // Only available, validated indicators contribute.
        // Attendance is excluded until the expected work calendar exists.
        $components = [
            'task_completion' => [
                'score' => $taskScore,
                'weight' => 40,
            ],
            'on_time_delivery' => [
                'score' => $deliveryScore,
                'weight' => 20,
            ],
            'manager_review' => [
                'score' => $managerScore,
                'weight' => 15,
            ],
        ];

        $weightedTotal = 0;
        $availableWeight = 0;

        foreach ($components as $component) {
            if ($component['score'] !== null) {
                $weightedTotal +=
                    $component['score'] * $component['weight'];

                $availableWeight += $component['weight'];
            }
        }

        $overallScore = $availableWeight > 0
            ? round($weightedTotal / $availableWeight, 2)
            : null;

        return [
            'employee_id' => $employee->id,
            'user_id' => $employee->user_id,
            'period' => $start->format('Y-m'),

            'tasks' => [
                'total' => $totalTasks,
                'completed' => $completedCount,
                'on_time' => $onTimeCount,
                'completion_score' => $taskScore,
                'on_time_score' => $deliveryScore,
            ],

            'attendance' => [
                'recorded_days' => $attendance->count(),
                'present_days' => $presentDays,
                'late_days' => $lateDays,
                'absent_days' => $absentDays,
                'leave_days' => $leaveDays,
                'attendance_score' => null,
                'note' => 'Expected working days and approved leave rules are not configured.',
            ],

            'manager_score' => $managerScore,
            'overall_score' => $overallScore,
            'available_weight' => $availableWeight,
            'maximum_weight' => 100,
            'is_partial' => $availableWeight < 100,

            'calculation_version' => 'v1-preview',
        ];
    }
}
