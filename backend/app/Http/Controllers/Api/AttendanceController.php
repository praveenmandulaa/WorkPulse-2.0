<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AttendanceController extends Controller
{
    private function employeeForUser(Request $request): Employee
    {
        return Employee::where('user_id', $request->user()->id)
            ->whereHas('user', fn ($q) => $q->where('is_active', 1))
            ->firstOrFail();
    }

    public function today(Request $request)
    {
        $employee = $this->employeeForUser($request);

        $today = now($employee->timezone)->toDateString();

        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('attendance_date', $today)
            ->first();

        return response()->json([
            'attendance' => $attendance,
            'shift_start' => $employee->shift_start,
            'shift_end' => $employee->shift_end,
            'timezone' => $employee->timezone,
        ]);
    }

    public function checkIn(Request $request)
    {
        $employee = $this->employeeForUser($request);

        return DB::transaction(function () use ($employee) {
            // Lock employee to serialize simultaneous check-in requests.
            Employee::whereKey($employee->id)
                ->lockForUpdate()
                ->firstOrFail();

            $now = now($employee->timezone);
            $date = $now->toDateString();

            if (Attendance::where('employee_id', $employee->id)
                ->whereDate('attendance_date', $date)->exists()) {
                throw ValidationException::withMessages([
                    'attendance' => 'You have already checked in today.',
                ]);
            }

            $shiftStart = Carbon::parse(
                $date . ' ' . $employee->shift_start,
                $employee->timezone
            );

            $allowedStart = $shiftStart->copy()
                ->addMinutes($employee->grace_minutes);

            $lateMinutes = $now->greaterThan($allowedStart)
                ? (int) $shiftStart->diffInMinutes($now)
                : 0;

            $attendance = Attendance::create([
                'employee_id' => $employee->id,
                'attendance_date' => $date,
                'check_in_at' => $now->copy()->utc(),
                'status' => $lateMinutes > 0 ? 'late' : 'present',
                'late_minutes' => $lateMinutes,
            ]);

            return response()->json([
                'message' => 'Checked in successfully.',
                'attendance' => $attendance,
            ], 201);
        });
    }

    public function checkOut(Request $request)
    {
        $employee = $this->employeeForUser($request);

        return DB::transaction(function () use ($employee) {
            $date = now($employee->timezone)->toDateString();

            $attendance = Attendance::where('employee_id', $employee->id)
                ->whereDate('attendance_date', $date)
                ->lockForUpdate()
                ->first();

            if (!$attendance || !$attendance->check_in_at) {
                throw ValidationException::withMessages([
                    'attendance' => 'Please check in first.',
                ]);
            }

            if ($attendance->check_out_at) {
                throw ValidationException::withMessages([
                    'attendance' => 'Already checked out today.',
                ]);
            }

            $now = now('UTC');

            $workedMinutes = max(
                0,
                (int) $attendance->check_in_at->diffInMinutes($now)
            );

            $attendance->update([
                'check_out_at' => $now,
                'worked_minutes' => $workedMinutes,
            ]);

            return response()->json([
                'message' => 'Checked out successfully.',
                'attendance' => $attendance->fresh(),
            ]);
        });
    }

    public function history(Request $request)
    {
        $employee = $this->employeeForUser($request);

        return Attendance::where('employee_id', $employee->id)
            ->latest('attendance_date')
            ->paginate(15);
    }

    public function adminIndex(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $date = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
        ])['date'] ?? now('Asia/Kolkata')->toDateString();

        $records = Attendance::with('employee.user:id,name,email')
            ->whereDate('attendance_date', $date)
            ->latest('check_in_at')
            ->paginate(15);

        $activeEmployees = Employee::whereHas(
            'user',
            fn ($q) => $q->where('is_active', 1)
        )->count();

        $present = Attendance::whereDate('attendance_date', $date)
            ->whereIn('status', ['present', 'late'])
            ->whereHas('employee.user', fn ($q) => $q->where('is_active', 1))
            ->count();

        $late = Attendance::whereDate('attendance_date', $date)
            ->where('status', 'late')
            ->whereHas('employee.user', fn ($q) => $q->where('is_active', 1))
            ->count();

        return response()->json([
            'date' => $date,
            'summary' => [
                'total_employees' => $activeEmployees,
                'present' => $present,
                'late' => $late,
                'not_checked_in' => max(0, $activeEmployees - $present),
            ],
            'records' => $records,
        ]);
    }
}