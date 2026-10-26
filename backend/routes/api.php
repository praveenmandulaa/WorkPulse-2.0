<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\PerformanceController;

use App\Http\Middleware\EnsureActiveUser;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Controllers\Api\PerformanceReviewController;
use App\Http\Controllers\Api\ManagerDashboardController;
use App\Http\Controllers\Api\AdminPerformanceController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\MyTaskController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth:sanctum',
    EnsureActiveUser::class,
])->group(function () {

    // Authentication
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    /*
    |--------------------------------------------------------------------------
    | Employee Performance
    |--------------------------------------------------------------------------
    | Accessible to authenticated users.
    | Employee-level permissions are checked in the controller.
    */

    Route::get('/performance/my', [
        PerformanceController::class,
        'myPerformance',
    ]);

    Route::get('/performance/employees/{employee}', [
        PerformanceController::class,
        'employeePerformance',
    ]);
Route::prefix('performance/reviews')->group(function () {

    Route::get('/', [
        PerformanceReviewController::class,
        'index',
    ]);

    Route::post('/', [
        PerformanceReviewController::class,
        'store',
    ]);

    Route::get('/{review}', [
        PerformanceReviewController::class,
        'show',
    ]);

    Route::put('/{review}', [
        PerformanceReviewController::class,
        'update',
    ]);

    Route::post('/{review}/finalize', [
        PerformanceReviewController::class,
        'finalize',
    ]);
});

Route::get('/performance/team', [
    PerformanceController::class,
    'team',
]);
Route::get('/manager/dashboard', [
            ManagerDashboardController::class,
            'overview',
        ]);
        
    /*
    |--------------------------------------------------------------------------
    | Task Management
    |--------------------------------------------------------------------------
    | Existing authorization checks in TaskController must remain enforced.
    */

    Route::get('/tasks', [
        TaskController::class,
        'index',
    ]);

    Route::post('/tasks', [
        TaskController::class,
        'store',
    ]);

    Route::get('/tasks/{task}', [
        TaskController::class,
        'show',
    ]);

    Route::put('/tasks/{task}', [
        TaskController::class,
        'update',
    ]);

    Route::patch('/tasks/{task}/status', [
        TaskController::class,
        'updateStatus',
    ]);

    Route::delete('/tasks/{task}', [
        TaskController::class,
        'destroy',
    ]);
Route::get('/my-tasks', [MyTaskController::class, 'index']);
    /*
    |--------------------------------------------------------------------------
    | Attendance Management
    |--------------------------------------------------------------------------
    */

    Route::prefix('attendance')->group(function () {

        Route::get('/today', [
            AttendanceController::class,
            'today',
        ]);

        Route::post('/check-in', [
            AttendanceController::class,
            'checkIn',
        ]);

        Route::post('/check-out', [
            AttendanceController::class,
            'checkOut',
        ]);

        Route::get('/history', [
            AttendanceController::class,
            'history',
        ]);

        Route::get('/admin', [
            AttendanceController::class,
            'adminIndex',
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Admin-Only Routes
    |--------------------------------------------------------------------------
    */

    Route::middleware(EnsureAdmin::class)->group(function () {

        // Employee Management
        Route::get('/employees', [
            EmployeeController::class,
            'index',
        ]);

        Route::post('/employees', [
            EmployeeController::class,
            'store',
        ]);

        Route::get('/employees/{employee}', [
            EmployeeController::class,
            'show',
        ]);

        Route::put('/employees/{employee}', [
            EmployeeController::class,
            'update',
        ]);

        Route::patch('/employees/{employee}/status', [
            EmployeeController::class,
            'toggleStatus',
        ]);

        // Admin Dashboard
        Route::get('/dashboard/overview', [
            DashboardController::class,
            'overview',
        ]);
        Route::get('/admin/performance', [
    AdminPerformanceController::class,
    'index',
]);

// Admin Reports
Route::get('/admin/reports', [
    ReportController::class,
    'index',
]);

Route::get('/admin/reports/export', [
    ReportController::class,
    'export',
]);
        
// Admin Settings
Route::get('/admin/settings', [
    SettingsController::class,
    'index',
]);

Route::put('/admin/settings/{group}', [
    SettingsController::class,
    'update',
])->where('group', 'company|attendance|performance');

Route::post('/admin/settings/{group}/reset', [
    SettingsController::class,
    'reset',
])->where('group', 'company|attendance|performance');

    });
});
