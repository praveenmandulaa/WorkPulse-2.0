<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ManagerDashboardController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $manager = $request->user();

        abort_unless($manager->role === 'manager', 403);

        $employees = Employee::query()
            ->with('user:id,name,email')
            ->where('manager_id', $manager->id)
            ->get();

        $employeeIds = $employees->pluck('id');
        $userIds = $employees->pluck('user_id');

        $tasks = Task::query()
            ->whereIn('assigned_to', $userIds)
            ->get();

        $today = now()->toDateString();

        $attendance = DB::table('attendances')
            ->whereIn('employee_id', $employeeIds)
            ->whereDate('attendance_date', $today)
            ->get();

        $presentIds = $attendance
            ->whereIn('status', ['present', 'late'])
            ->pluck('employee_id')
            ->unique();

        $lateIds = $attendance
            ->where('status', 'late')
            ->pluck('employee_id')
            ->unique();

        $reviews = DB::table('performance_reviews')
            ->whereIn('employee_id', $employeeIds)
            ->get();

        $completedTasks = $tasks
            ->where('status', 'completed')
            ->count();

        $inProgressTasks = $tasks
            ->where('status', 'in_progress')
            ->count();

        $overdueTasks = $tasks->filter(function ($task) use ($today) {
            return $task->status !== 'completed'
                && $task->due_date !== null
                && substr((string) $task->due_date, 0, 10) < $today;
        })->count();

        return response()->json([
            'message' => 'Manager dashboard loaded successfully.',

            'data' => [
                'metrics' => [
                    'team_members' => $employees->count(),
                    'total_tasks' => $tasks->count(),
                    'completed_tasks' => $completedTasks,
                    'in_progress_tasks' => $inProgressTasks,
                    'overdue_tasks' => $overdueTasks,
                    'present_today' => $presentIds->count(),
                    'late_today' => $lateIds->count(),
                    'not_checked_in' => max(
                        0,
                        $employees->count() - $presentIds->count()
                    ),
                    'total_reviews' => $reviews->count(),
                    'finalized_reviews' => $reviews
                        ->where('status', 'finalized')
                        ->count(),
                ],

                'team' => $employees->map(function ($employee) use (
                    $tasks,
                    $presentIds
                ) {
                    $employeeTasks = $tasks->where(
                        'assigned_to',
                        $employee->user_id
                    );

                    return [
                        'id' => $employee->id,
                        'name' => $employee->user?->name,
                        'email' => $employee->user?->email,
                        'department' => $employee->department,
                        'designation' => $employee->designation,
                        'is_present' => $presentIds->contains($employee->id),
                        'total_tasks' => $employeeTasks->count(),
                        'completed_tasks' => $employeeTasks
                            ->where('status', 'completed')
                            ->count(),
                    ];
                })->values(),
            ],
        ]);
    }
}