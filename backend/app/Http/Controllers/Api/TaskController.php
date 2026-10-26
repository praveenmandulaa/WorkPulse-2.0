<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TaskController extends Controller
{
    private const STATUSES = [
        'todo', 'in_progress', 'in_review',
        'completed', 'blocked',
    ];

    private const PRIORITIES = [
        'low', 'medium', 'high', 'urgent',
    ];

    private function canManage(Request $request): bool
    {
        return in_array(
            $request->user()->role,
            ['admin', 'manager'],
            true
        );
    }

    private function visibleTasks(Request $request)
    {
        $query = Task::query();

        if ($request->user()->role === 'employee') {
            $query->where('assigned_to', $request->user()->id);
        }

        if ($request->user()->role === 'manager') {
            $managerId = $request->user()->id;

            $query->where(function ($q) use ($managerId) {
                $q->where('created_by', $managerId)
                    ->orWhere('assigned_to', $managerId)
                    ->orWhereHas('assignee.employee', function ($employee) use ($managerId) {
                        $employee->where('manager_id', $managerId);
                    });
            });
        }

        return $query;
    }

    private function canAssign(Request $request, int $userId): bool
    {
        $assignee = User::whereKey($userId)
            ->where('is_active', true)
            ->whereIn('role', ['employee', 'manager'])
            ->first();

        if (!$assignee) {
            return false;
        }

        if ($request->user()->role === 'admin') {
            return true;
        }

        return $assignee->id === $request->user()->id
            || $assignee->employee()
                ->where('manager_id', $request->user()->id)
                ->exists();
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(self::STATUSES)],
            'priority' => ['nullable', Rule::in(self::PRIORITIES)],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = $this->visibleTasks($request);

        if (!empty($validated['search'])) {
            $query->where('title', 'like', '%' . $validated['search'] . '%');
        }

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (!empty($validated['priority'])) {
            $query->where('priority', $validated['priority']);
        }

        return response()->json(
            $query->with([
                'assignee:id,name,email',
                'creator:id,name',
            ])
            ->latest()
            ->paginate($request->integer('per_page', 10))
        );
    }

    public function store(Request $request)
    {
        abort_unless($this->canManage($request), 403);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'assigned_to' => ['required', 'integer', 'exists:users,id'],
            'priority' => ['required', Rule::in(self::PRIORITIES)],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        if (!$this->canAssign($request, (int) $data['assigned_to'])) {
            throw ValidationException::withMessages([
                'assigned_to' => 'Select an active, authorized team member.',
            ]);
        }

        $task = Task::create([
            ...$data,
            'created_by' => $request->user()->id,
            'status' => 'todo',
            'progress' => 0,
        ]);

        return response()->json([
            'message' => 'Task created successfully.',
            'task' => $task->load('assignee:id,name,email', 'creator:id,name'),
        ], 201);
    }

    public function show(Request $request, Task $task)
    {
        $visible = $this->visibleTasks($request)
            ->whereKey($task->id)
            ->exists();

        abort_unless($visible, 403);

        return response()->json(
            $task->load('assignee:id,name,email', 'creator:id,name')
        );
    }

    public function update(Request $request, Task $task)
    {
        abort_unless($this->canManage($request), 403);

        $visible = $this->visibleTasks($request)
            ->whereKey($task->id)
            ->exists();

        abort_unless($visible, 403);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'assigned_to' => ['required', 'integer', 'exists:users,id'],
            'priority' => ['required', Rule::in(self::PRIORITIES)],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        if (!$this->canAssign($request, (int) $data['assigned_to'])) {
            throw ValidationException::withMessages([
                'assigned_to' => 'Select an active, authorized team member.',
            ]);
        }

        $task->update($data);

        return response()->json([
            'message' => 'Task updated successfully.',
            'task' => $task->fresh()->load('assignee:id,name,email'),
        ]);
    }

    public function updateStatus(Request $request, Task $task)
    {
        $visible = $this->visibleTasks($request)
            ->whereKey($task->id)
            ->exists();

        abort_unless($visible, 403);

        if (
            $request->user()->role !== 'admin' &&
            (int) $task->assigned_to !== (int) $request->user()->id
        ) {
            abort(403);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(self::STATUSES)],
            'progress' => ['required', 'integer', 'between:0,100'],
        ]);

        if ($data['status'] === 'completed' && $data['progress'] !== 100) {
            throw ValidationException::withMessages([
                'progress' => 'Completed tasks must have 100% progress.',
            ]);
        }

        if ($data['status'] !== 'completed' && $data['progress'] === 100) {
            throw ValidationException::withMessages([
                'progress' => 'Use completed status for 100% progress.',
            ]);
        }

        DB::transaction(function () use ($task, $data) {
            $task->update([
                ...$data,
                'completed_at' => $data['status'] === 'completed'
                    ? ($task->completed_at ?? now())
                    : null,
            ]);
        });

        return response()->json([
            'message' => 'Task status updated.',
            'task' => $task->fresh(),
        ]);
    }

    public function destroy(Request $request, Task $task)
    {
        abort_unless($this->canManage($request), 403);

        $visible = $this->visibleTasks($request)
            ->whereKey($task->id)
            ->exists();

        abort_unless($visible, 403);

        $task->delete();

        return response()->json([
            'message' => 'Task archived successfully.',
        ]);
    }
}