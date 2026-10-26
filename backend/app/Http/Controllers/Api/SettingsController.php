<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SettingsController extends Controller
{
    private const DEFAULTS = [
        'company' => [
            'name' => 'WorkPulse',
            'email' => '',
            'phone' => '',
            'address' => '',
            'timezone' => 'Asia/Kolkata',
        ],
        'attendance' => [
            'work_start' => '09:00',
            'work_end' => '18:00',
            'grace_minutes' => 10,
            'working_days' => [1, 2, 3, 4, 5],
        ],
        'performance' => [
            'task_completion_weight' => 40,
            'on_time_delivery_weight' => 20,
            'attendance_weight' => 25,
            'manager_review_weight' => 15,
        ],
    ];

    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'Settings loaded successfully.',
            'data' => $this->allSettings(),
        ]);
    }

    public function update(Request $request, string $group): JsonResponse
    {
        if (!array_key_exists($group, self::DEFAULTS)) {
            return response()->json(['message' => 'Unknown settings group.'], 404);
        }

        $rules = match ($group) {
            'company' => [
                'name' => ['required', 'string', 'max:150'],
                'email' => ['present', 'nullable', 'email', 'max:255'],
                'phone' => ['present', 'nullable', 'string', 'max:30'],
                'address' => ['present', 'nullable', 'string', 'max:500'],
                'timezone' => ['required', 'timezone'],
            ],
            'attendance' => [
                'work_start' => ['required', 'date_format:H:i'],
                'work_end' => ['required', 'date_format:H:i', 'different:work_start'],
                'grace_minutes' => ['required', 'integer', 'between:0,120'],
                'working_days' => ['required', 'array', 'min:1', 'max:7'],
                'working_days.*' => ['required', 'integer', 'between:1,7', 'distinct'],
            ],
            'performance' => [
                'task_completion_weight' => ['required', 'integer', 'between:0,100'],
                'on_time_delivery_weight' => ['required', 'integer', 'between:0,100'],
                'attendance_weight' => ['required', 'integer', 'between:0,100'],
                'manager_review_weight' => ['required', 'integer', 'between:0,100'],
            ],
        };

        $validated = Validator::make($request->all(), $rules)->validate();

        if ($group === 'performance' && array_sum($validated) !== 100) {
            throw ValidationException::withMessages([
                'weights' => ['Performance weights must total exactly 100%.'],
            ]);
        }

        if ($group === 'attendance') {
            sort($validated['working_days']);
        }

        DB::transaction(function () use ($group, $validated): void {
            foreach ($validated as $key => $value) {
                DB::table('app_settings')->updateOrInsert(
                    ['group' => $group, 'key' => $key],
                    ['value' => json_encode($value, JSON_THROW_ON_ERROR), 'updated_at' => now(), 'created_at' => now()]
                );
            }
        });

        return response()->json([
            'message' => ucfirst($group) . ' settings saved successfully.',
            'data' => $this->allSettings()[$group],
        ]);
    }

    public function reset(string $group): JsonResponse
    {
        if (!array_key_exists($group, self::DEFAULTS)) {
            return response()->json(['message' => 'Unknown settings group.'], 404);
        }

        DB::table('app_settings')->where('group', $group)->delete();

        return response()->json([
            'message' => ucfirst($group) . ' settings restored to defaults.',
            'data' => self::DEFAULTS[$group],
        ]);
    }

    private function allSettings(): array
    {
        $settings = self::DEFAULTS;
        $records = DB::table('app_settings')->get(['group', 'key', 'value']);

        foreach ($records as $record) {
            if (array_key_exists($record->group, $settings)
                && array_key_exists($record->key, $settings[$record->group])) {
                $settings[$record->group][$record->key] = json_decode($record->value, true);
            }
        }

        return $settings;
    }
}
