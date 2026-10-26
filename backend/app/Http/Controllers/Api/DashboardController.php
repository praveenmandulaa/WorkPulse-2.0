<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function overview(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $today = Carbon::today();

        $totalEmployees = Employee::whereHas('user', function ($query) {
            $query->where('is_active', 1);
        })->count();

        $totalTasks = Task::count();

        $completedTasks = Task::where('status', 'completed')->count();

        $inProgressTasks = Task::where('status', 'in_progress')->count();

        $overdueTasks = Task::whereNotNull('due_date')
            ->whereDate('due_date', '<', $today)
            ->where('status', '!=', 'completed')
            ->count();

        $completionRate = $totalTasks > 0
            ? round(($completedTasks / $totalTasks) * 100, 1)
            : 0;

        $statuses = [
            'todo',
            'in_progress',
            'in_review',
            'completed',
            'blocked',
        ];

        $colors = [
            'todo' => '#a5b4fc',
            'in_progress' => '#6366f1',
            'in_review' => '#f59e0b',
            'completed' => '#16a34a',
            'blocked' => '#ef4444',
        ];

        $taskStatus = [];

        foreach ($statuses as $status) {
            $taskStatus[] = [
                'name' => ucwords(str_replace('_', ' ', $status)),
                'value' => Task::where('status', $status)->count(),
                'color' => $colors[$status],
            ];
        }

        $productivity = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = $today->copy()->subDays($i);

            $productivity[] = [
                'day' => $date->format('D'),
                'assigned' => Task::whereDate('created_at', $date)->count(),
                'completed' => Task::whereDate('completed_at', $date)->count(),
            ];
        }

        $recentTasks = Task::with([
            'assignee:id,name',
            'creator:id,name',
        ])
            ->latest('updated_at')
            ->limit(5)
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->status,
                    'assignee' => $task->assignee?->name ?? 'Unassigned',
                    'updated_at' => $task->updated_at?->toIso8601String(),
                ];
            });

        return response()->json([
            'metrics' => [
                'total_employees' => $totalEmployees,
                'total_tasks' => $totalTasks,
                'in_progress_tasks' => $inProgressTasks,
                'completed_tasks' => $completedTasks,
                'overdue_tasks' => $overdueTasks,
                'completion_rate' => $completionRate,
            ],
            'productivity' => $productivity,
            'task_status' => $taskStatus,
            'recent_tasks' => $recentTasks,
        ]);
    }
}
