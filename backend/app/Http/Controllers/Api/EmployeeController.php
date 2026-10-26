<?php

namespace App\Http\Controllers\Api;


use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    // GET /api/employees
    public function index(Request $request)
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::in(['employee', 'manager'])],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Employee::with([
            'user:id,name,email,role,is_active',
            'manager:id,name',
        ]);

        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where('employee_code', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        if ($request->filled('role')) {
            $query->whereHas('user', fn ($q) =>
                $q->where('role', $request->role)
            );
        }

        if ($request->filled('status')) {
            $active = $request->status === 'active';

            $query->whereHas('user', fn ($q) =>
                $q->where('is_active', $active)
            );
        }

        return response()->json(
            $query->latest('id')
                ->paginate($request->integer('per_page', 10))
        );
    }

    // POST /api/employees
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:12'],
            'role' => ['required', Rule::in(['employee', 'manager'])],
            'employee_code' => [
                'required', 'string', 'max:30',
                'unique:employees,employee_code',
            ],
            'department' => ['required', 'string', 'max:100'],
            'designation' => ['required', 'string', 'max:100'],
            'joining_date' => ['required', 'date'],
            'manager_id' => [
                'nullable',
                Rule::exists('users', 'id')
                    ->where('role', 'manager')
                    ->where('is_active', 1),
            ],
        ]);

        $employee = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => $validated['role'],
                'is_active' => true,
            ]);

            return Employee::create([
                'user_id' => $user->id,
                'employee_code' => $validated['employee_code'],
                'department' => $validated['department'],
                'designation' => $validated['designation'],
                'joining_date' => $validated['joining_date'],
                'manager_id' => $validated['manager_id'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Employee created successfully.',
            'employee' => $employee->load('user', 'manager'),
        ], 201);
    }

    // GET /api/employees/{employee}
    public function show(Employee $employee)
    {
        return response()->json(
            $employee->load('user', 'manager')
        );
    }

    // PUT /api/employees/{employee}
    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($employee->user_id),
            ],
            'role' => ['required', Rule::in(['employee', 'manager'])],
            'employee_code' => [
                'required', 'string', 'max:30',
                Rule::unique('employees', 'employee_code')->ignore($employee->id),
            ],
            'department' => ['required', 'string', 'max:100'],
            'designation' => ['required', 'string', 'max:100'],
            'joining_date' => ['required', 'date'],
            'manager_id' => [
                'nullable',
                Rule::exists('users', 'id')
                    ->where('role', 'manager')
                    ->where('is_active', 1),
            ],
        ]);

        if (
            isset($validated['manager_id']) &&
            $validated['manager_id'] == $employee->user_id
        ) {
            return response()->json([
                'message' => 'An employee cannot manage themselves.',
            ], 422);
        }

        if (
            $employee->user->role === 'manager' &&
            $validated['role'] !== 'manager' &&
            Employee::where('manager_id', $employee->user_id)->exists()
        ) {
            return response()->json([
                'message' => 'Reassign this manager’s employees before changing their role.',
            ], 422);
        }

        DB::transaction(function () use ($employee, $validated) {
            $employee->user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'role' => $validated['role'],
            ]);

            $employee->update([
                'employee_code' => $validated['employee_code'],
                'department' => $validated['department'],
                'designation' => $validated['designation'],
                'joining_date' => $validated['joining_date'],
                'manager_id' => $validated['manager_id'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Employee updated successfully.',
            'employee' => $employee->fresh()->load('user', 'manager'),
        ]);
    }

    // PATCH /api/employees/{employee}/status
    public function toggleStatus(Employee $employee)
    {
        $user = $employee->user;

        if (
            $user->role === 'manager' &&
            $user->is_active &&
            Employee::where('manager_id', $user->id)
                ->whereHas('user', fn ($q) => $q->where('is_active', true))
                ->exists()
        ) {
            return response()->json([
                'message' => 'Reassign active team members before deactivating this manager.',
            ], 422);
        }

        $user->update([
            'is_active' => !$user->is_active,
        ]);

        return response()->json([
            'message' => $user->is_active
                ? 'Employee activated successfully.'
                : 'Employee deactivated successfully.',
            'is_active' => $user->is_active,
        ]);
    }
}
