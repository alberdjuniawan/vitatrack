<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\HealthLogController;
use App\Http\Controllers\InsightController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return response()->json(['status' => 'success', 'data' => $request->user()]);
    });
    Route::match(['put', 'patch'], '/user/profile', [ProfileController::class, 'update']);

    Route::apiResource('health-logs', HealthLogController::class)->only(['index', 'store', 'update']);
    Route::post('/assessments/weekly', [HealthLogController::class, 'storeWeekly']);

    Route::get('/insights', [InsightController::class, 'index']);
    Route::get('/insights/dashboard', [InsightController::class, 'dashboard']);
});