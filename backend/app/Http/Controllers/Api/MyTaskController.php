<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;

class MyTaskController extends Controller
{
    public function index(Request $request)
    {
        $tasks = Task::query()
            ->where('assigned_to', $request->user()->id)
            ->orderBy('due_date')
            ->get();

        return response()->json([
            'message' => 'My tasks loaded successfully',
            'data' => $tasks,
        ]);
    }
}