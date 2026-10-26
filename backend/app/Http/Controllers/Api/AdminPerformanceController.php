<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Services\PerformanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminPerformanceController extends Controller
{
    public function index(
        Request $request,
        PerformanceService $performanceService
    ): JsonResponse {
        $validated = $request->validate([
            'month' => [
                'nullable',
                'date_format:Y-m',
            ],
        ]);

        $month = $validated['month'] ?? now()->format('Y-m');

        $period = Carbon::createFromFormat('!Y-m', $month);
        $start = $period->copy()->startOfMonth();
        $end = $period->copy()->endOfMonth();

        $employees = Employee::query()
            ->with('user:id,name,email')
            ->orderBy('id')
            ->get();

        $reviews = DB::table('performance_reviews')
            ->whereBetween('review_period', [
                $start->toDateString(),
                $end->toDateString(),
            ])
            ->where('status', 'finalized')
            ->get()
            ->keyBy('employee_id');

        $rows = $employees->map(function ($employee) use (
            $performanceService,
            $month,
            $reviews
        ) {
            $result = $performanceService->calculate(
                $employee,
                $month
            );

            $review = $reviews->get($employee->id);

            return [
                'employee_id' => $employee->id,
                'name' => $employee->user?->name ?? 'Unknown',
                'email' => $employee->user?->email,
                'department' => $employee->department,
                'designation' => $employee->designation,
                'task_total' => $result['tasks']['total'],
                'task_completed' => $result['tasks']['completed'],
                'task_completion_score' =>
                    $result['tasks']['completion_score'],
                'on_time_score' =>
                    $result['tasks']['on_time_score'],
                'manager_score' => $result['manager_score'],
                'overall_score' => $result['overall_score'],
                'available_weight' => $result['available_weight'],
                'is_partial' => $result['is_partial'],
                'review_status' => $review
                    ? 'finalized'
                    : 'not_finalized',
            ];
        })->values();

        $scored = $rows->filter(
            fn ($row) => $row['overall_score'] !== null
        );

        $averageScore = $scored->isNotEmpty()
            ? round($scored->avg('overall_score'), 2)
            : null;

        $totalTasks = $rows->sum('task_total');
        $completedTasks = $rows->sum('task_completed');

        $taskCompletionRate = $totalTasks > 0
            ? round(($completedTasks / $totalTasks) * 100, 2)
            : null;

        $departmentStats = $rows
            ->groupBy(fn ($row) => $row['department'] ?: 'Unassigned')
            ->map(function ($members, $department) {
                $scoredMembers = $members->filter(
                    fn ($member) => $member['overall_score'] !== null
                );

                return [
                    'department' => $department,
                    'employees' => $members->count(),
                    'average_score' => $scoredMembers->isNotEmpty()
                        ? round(
                            $scoredMembers->avg('overall_score'),
                            2
                        )
                        : null,
                ];
            })
            ->values();

        return response()->json([
            'message' => 'Admin performance analytics loaded.',
            'data' => [
                'month' => $month,
                'summary' => [
                    'total_employees' => $employees->count(),
                    'employees_scored' => $scored->count(),
                    'average_score' => $averageScore,
                    'total_tasks' => $totalTasks,
                    'completed_tasks' => $completedTasks,
                    'task_completion_rate' => $taskCompletionRate,
                    'finalized_reviews' => $reviews->count(),
                ],
                'employees' => $rows,
                'departments' => $departmentStats,
                'note' => 'Scores are provisional and normalize only available indicators. Attendance scoring is not yet configured.',
            ],
        ]);
    }
}