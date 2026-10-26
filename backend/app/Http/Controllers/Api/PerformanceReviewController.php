<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\PerformanceReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PerformanceReviewController extends Controller
{
    private function canManage(
        $user,
        Employee $employee
    ): bool {
        return $user->role === 'admin'
            || (
                $user->role === 'manager'
                && (int) $employee->manager_id === (int) $user->id
            );
    }

    private function canView(
        $user,
        Employee $employee
    ): bool {
        return $this->canManage($user, $employee)
            || (
                (int) $employee->user_id === (int) $user->id
            );
    }

    private function validateReview(Request $request): array
    {
        return $request->validate([
            'employee_id' => [
                'required',
                'integer',
                'exists:employees,id',
            ],
            'review_period' => [
                'required',
                'date_format:Y-m',
            ],
            'quality_rating' => [
                'required',
                'integer',
                'between:1,5',
            ],
            'communication_rating' => [
                'required',
                'integer',
                'between:1,5',
            ],
            'teamwork_rating' => [
                'required',
                'integer',
                'between:1,5',
            ],
            'initiative_rating' => [
                'required',
                'integer',
                'between:1,5',
            ],
            'strengths' => [
                'nullable',
                'string',
                'max:5000',
            ],
            'improvements' => [
                'nullable',
                'string',
                'max:5000',
            ],
            'feedback' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);
    }

    private function managerScore(array $data): float
    {
        $sum =
            $data['quality_rating']
            + $data['communication_rating']
            + $data['teamwork_rating']
            + $data['initiative_rating'];

        return round(($sum / 20) * 100, 2);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = PerformanceReview::query()
            ->with(['employee.user', 'reviewer'])
            ->latest();

        if ($user->role === 'manager') {
            $query->whereHas('employee', function ($q) use ($user) {
                $q->where('manager_id', $user->id);
            });
        } elseif ($user->role === 'employee') {
            $query->whereHas('employee', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->where('status', 'finalized');
        } elseif ($user->role !== 'admin') {
            abort(403);
        }

        return response()->json(
            $query->paginate(15)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        abort_unless(
            in_array($user->role, ['admin', 'manager'], true),
            403
        );

        $data = $this->validateReview($request);

        $employee = Employee::findOrFail(
            $data['employee_id']
        );

        abort_unless(
            $this->canManage($user, $employee),
            403,
            'You cannot review this employee.'
        );

        $period = Carbon::createFromFormat(
            '!Y-m',
            $data['review_period']
        )->startOfMonth()->toDateString();

        $exists = PerformanceReview::where(
            'employee_id',
            $employee->id
        )->whereDate('review_period', $period)->exists();

        if ($exists) {
            return response()->json([
                'message' => 'A review already exists for this month.',
            ], 409);
        }

        $data['review_period'] = $period;
        $data['reviewer_id'] = $user->id;
        $data['manager_score'] = $this->managerScore($data);
        $data['status'] = 'draft';

        $review = PerformanceReview::create($data);

        return response()->json([
            'message' => 'Performance review created successfully.',
            'data' => $review,
        ], 201);
    }

    public function show(
        Request $request,
        PerformanceReview $review
    ): JsonResponse {
        $review->load(['employee.user', 'reviewer']);

        abort_unless(
            $this->canView($request->user(), $review->employee),
            403
        );

        if (
            $request->user()->role === 'employee'
            && $review->status !== 'finalized'
        ) {
            abort(403);
        }

        return response()->json([
            'data' => $review,
        ]);
    }

    public function update(
        Request $request,
        PerformanceReview $review
    ): JsonResponse {
        abort_unless(
            $this->canManage($request->user(), $review->employee),
            403
        );

        if ($review->status === 'finalized') {
            return response()->json([
                'message' => 'Finalized reviews cannot be edited.',
            ], 409);
        }

        $data = $this->validateReview($request);

        if ((int) $data['employee_id'] !== (int) $review->employee_id) {
            return response()->json([
                'message' => 'Employee cannot be changed.',
            ], 422);
        }

        $period = Carbon::createFromFormat(
            '!Y-m',
            $data['review_period']
        )->startOfMonth()->toDateString();

        if ($period !== $review->review_period->toDateString()) {
            return response()->json([
                'message' => 'Review month cannot be changed.',
            ], 422);
        }

        unset($data['employee_id'], $data['review_period']);

        $data['manager_score'] = $this->managerScore($data);

        $review->update($data);

        return response()->json([
            'message' => 'Review updated successfully.',
            'data' => $review->fresh(),
        ]);
    }

    public function finalize(
        Request $request,
        PerformanceReview $review
    ): JsonResponse {
        abort_unless(
            $this->canManage($request->user(), $review->employee),
            403
        );

        if ($review->status === 'finalized') {
            return response()->json([
                'message' => 'Review is already finalized.',
            ], 409);
        }

        $review->update([
            'status' => 'finalized',
            'finalized_at' => now(),
        ]);

        return response()->json([
            'message' => 'Performance review finalized successfully.',
            'data' => $review->fresh(),
        ]);
    }
}