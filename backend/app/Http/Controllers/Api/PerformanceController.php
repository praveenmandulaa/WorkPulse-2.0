<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Services\PerformanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PerformanceController extends Controller
{
    public function myPerformance(
        Request $request,
        PerformanceService $service
    ): JsonResponse {
        $data = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
        ]);

        $employee = Employee::query()
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$employee) {
            return response()->json([
                'message' => 'Employee profile not found.',
            ], 404);
        }

        $month = $data['month'] ?? now()->format('Y-m');

        return response()->json([
            'message' => 'Performance calculated successfully.',
            'data' => $service->calculate($employee, $month),
        ]);
    }

    public function employeePerformance(
        Request $request,
        Employee $employee,
        PerformanceService $service
    ): JsonResponse {
        $data = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
        ]);

        $user = $request->user();

        $isAdmin = $user->role === 'admin';

        $isAssignedManager =
            $user->role === 'manager'
            && (int) $employee->manager_id === (int) $user->id;

        $isOwner =
            (int) $employee->user_id === (int) $user->id;

        abort_unless(
            $isAdmin || $isAssignedManager || $isOwner,
            403,
            'You are not authorized to view this employee.'
        );

        $month = $data['month'] ?? now()->format('Y-m');

        return response()->json([
            'message' => 'Performance calculated successfully.',
            'data' => $service->calculate($employee, $month),
        ]);
    }
    public function team(Request $request): JsonResponse
{
    $user = $request->user();

    abort_unless(
        in_array($user->role, ['admin', 'manager'], true),
        403
    );

    $query = Employee::query()
        ->with('user:id,name,email,role');

    if ($user->role === 'manager') {
        $query->where('manager_id', $user->id);
    }

    return response()->json([
        'data' => $query->orderBy('id')->get(),
    ]);
}
}