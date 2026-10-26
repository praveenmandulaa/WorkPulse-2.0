<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Services\PerformanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    private function filters(Request $request): array
    {
        return $request->validate([
            'type' => ['required', 'in:employees,tasks,attendance,performance'],
            'month' => ['nullable', 'date_format:Y-m'],
            'department' => ['nullable', 'string', 'max:100'],
            'employee_id' => ['nullable', 'integer', 'exists:employees,id'],
        ]);
    }

    private function build(Request $request, PerformanceService $service): array
    {
        $filters = $this->filters($request);
        $type = $filters['type'];
        $month = $filters['month'] ?? now()->format('Y-m');
        $start = Carbon::createFromFormat('!Y-m', $month)->startOfMonth();
        $end = $start->copy()->endOfMonth();
        $from = $start->toDateString();
        $to = $end->toDateString();
        $department = $filters['department'] ?? null;
        $employeeId = $filters['employee_id'] ?? null;

        $employees = Employee::query()
            ->join('users', 'users.id', '=', 'employees.user_id')
            ->when($department, fn ($q) => $q->where('employees.department', $department))
            ->when($employeeId, fn ($q) => $q->where('employees.id', $employeeId));

        $rows = match ($type) {
            'employees' => (clone $employees)
                ->select('employees.id as employee_id', 'employees.employee_code',
                    'users.name', 'users.email', 'users.role', 'users.is_active',
                    'employees.department', 'employees.designation', 'employees.joining_date')
                ->orderBy('users.name')->get()->map(fn ($r) => [
                    'employee_code' => $r->employee_code,
                    'name' => $r->name,
                    'email' => $r->email,
                    'department' => $r->department,
                    'designation' => $r->designation,
                    'role' => $r->role,
                    'joining_date' => $r->joining_date,
                    'active' => (bool) $r->is_active ? 'Yes' : 'No',
                ])->all(),
            'tasks' => DB::table('tasks')
                ->join('employees', 'employees.user_id', '=', 'tasks.assigned_to')
                ->join('users', 'users.id', '=', 'employees.user_id')
                ->whereNull('tasks.deleted_at')
                ->whereBetween('tasks.due_date', [$from, $to])
                ->when($department, fn ($q) => $q->where('employees.department', $department))
                ->when($employeeId, fn ($q) => $q->where('employees.id', $employeeId))
                ->select('tasks.id', 'tasks.title', 'users.name as employee',
                    'employees.department', 'tasks.status', 'tasks.priority',
                    'tasks.progress', 'tasks.due_date', 'tasks.completed_at')
                ->orderBy('tasks.due_date')->get()->map(fn ($r) => [
                    'task_id' => $r->id,
                    'title' => $r->title,
                    'employee' => $r->employee,
                    'department' => $r->department,
                    'status' => $r->status,
                    'priority' => $r->priority,
                    'progress' => $r->progress,
                    'due_date' => $r->due_date,
                    'completed_at' => $r->completed_at,
                ])->all(),
            'attendance' => DB::table('attendances')
                ->join('employees', 'employees.id', '=', 'attendances.employee_id')
                ->join('users', 'users.id', '=', 'employees.user_id')
                ->whereBetween('attendances.attendance_date', [$from, $to])
                ->when($department, fn ($q) => $q->where('employees.department', $department))
                ->when($employeeId, fn ($q) => $q->where('employees.id', $employeeId))
                ->select('users.name as employee', 'employees.department',
                    'attendances.attendance_date', 'attendances.status',
                    'attendances.check_in_at', 'attendances.check_out_at',
                    'attendances.worked_minutes', 'attendances.late_minutes')
                ->orderByDesc('attendances.attendance_date')->get()->map(fn ($r) => [
                    'employee' => $r->employee,
                    'department' => $r->department,
                    'date' => $r->attendance_date,
                    'status' => $r->status,
                    'check_in' => $r->check_in_at,
                    'check_out' => $r->check_out_at,
                    'worked_minutes' => $r->worked_minutes,
                    'late_minutes' => $r->late_minutes,
                ])->all(),
            'performance' => (clone $employees)
                ->select('employees.*', 'users.name as employee_name')
                ->orderBy('users.name')->get()->map(function ($employee) use ($service, $month) {
                    $score = $service->calculate($employee, $month);
                    return [
                        'employee' => $employee->employee_name,
                        'department' => $employee->department,
                        'task_completion' => $score['tasks']['completion_score'],
                        'on_time' => $score['tasks']['on_time_score'],
                        'manager_score' => $score['manager_score'],
                        'overall_score' => $score['overall_score'],
                        'available_weight' => $score['available_weight'],
                        'provisional' => $score['is_partial'] ? 'Yes' : 'No',
                    ];
                })->all(),
        };

        $columns = match ($type) {
            'employees' => ['employee_code' => 'Code', 'name' => 'Name', 'email' => 'Email',
                'department' => 'Department', 'designation' => 'Designation', 'role' => 'Role',
                'joining_date' => 'Joining Date', 'active' => 'Active'],
            'tasks' => ['task_id' => 'Task ID', 'title' => 'Title', 'employee' => 'Employee',
                'department' => 'Department', 'status' => 'Status', 'priority' => 'Priority',
                'progress' => 'Progress (%)', 'due_date' => 'Due Date', 'completed_at' => 'Completed At'],
            'attendance' => ['employee' => 'Employee', 'department' => 'Department',
                'date' => 'Date', 'status' => 'Status', 'check_in' => 'Check In',
                'check_out' => 'Check Out', 'worked_minutes' => 'Worked Minutes',
                'late_minutes' => 'Late Minutes'],
            'performance' => ['employee' => 'Employee', 'department' => 'Department',
                'task_completion' => 'Task Completion (%)', 'on_time' => 'On Time (%)',
                'manager_score' => 'Manager Review (%)', 'overall_score' => 'Overall (%)',
                'available_weight' => 'Available Weight', 'provisional' => 'Provisional'],
        };

        return [
            'type' => $type,
            'month' => $month,
            'columns' => $columns,
            'rows' => $rows,
            'summary' => ['total_rows' => count($rows)],
            'note' => $type === 'performance'
                ? 'Performance scores are provisional. Missing indicators are excluded from the weighted score.'
                : ($type === 'employees' ? 'Employee directory is not restricted by the selected month.'
                    : 'Task report includes tasks due in the selected month; attendance uses attendance date.'),
        ];
    }

    public function index(Request $request, PerformanceService $service): JsonResponse
    {
        return response()->json([
            'message' => 'Report generated successfully.',
            'data' => $this->build($request, $service),
        ]);
    }

    public function export(Request $request, PerformanceService $service): StreamedResponse
    {
        $report = $this->build($request, $service);
        $filename = 'workpulse_' . $report['type'] . '_' . $report['month'] . '.csv';

        return response()->streamDownload(function () use ($report) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // Excel UTF-8 BOM
            fputcsv($out, array_values($report['columns']));
            foreach ($report['rows'] as $row) {
                // Prevent spreadsheet formula injection from user-controlled strings.
                $values = array_map(function ($value) {
                    if ($value === null) return '';
                    $text = (string) $value;
                    return preg_match('/^[\s\x00-\x1F]*[=+@\-]/u', $text) ? "'" . $text : $text;
                }, array_values($row));
                fputcsv($out, $values);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
