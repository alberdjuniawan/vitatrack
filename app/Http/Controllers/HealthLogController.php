<?php

namespace App\Http\Controllers;

use App\Models\HealthLog;
use App\Jobs\GenerateDailyInsight;
use App\Jobs\GenerateWeeklyInsight;
use App\Events\HealthLogCreated;
use App\Http\Requests\StoreDailyLogRequest;
use App\Http\Requests\StoreWeeklyAssessmentRequest;
use Illuminate\Http\Request;
use Carbon\Carbon;

class HealthLogController extends Controller
{
    public function index(Request $request)
    {
        $timeframe = $request->query('timeframe', 7); 

        $query = HealthLog::where('user_id', $request->user()->id)
                          ->orderBy('log_date', 'desc');

        if ($timeframe == 7) {
            $query->take(7);
        } elseif ($timeframe == 30) {
            $query->take(30);
        } elseif ($timeframe == 365) {
            $query->whereDate('log_date', '>=', now()->subDays(365));
        }

        $logs = $query->get();

        return $this->successResponse($logs->reverse()->values(), 'Health logs retrieved successfully');
    }

    public function store(StoreDailyLogRequest $request)
    {
        $validated = $request->validated();
        $validated['user_id'] = $request->user()->id;

        $healthLog = HealthLog::updateOrCreate(
            ['user_id' => $validated['user_id'], 'log_date' => $validated['log_date']],
            $validated
        );

        event(new HealthLogCreated($healthLog));
        GenerateDailyInsight::dispatch($healthLog);

        return $this->successResponse(
            $healthLog, 
            'Daily check-in saved successfully. AI is analyzing...', 
            201
        );
    }

    public function storeWeekly(StoreWeeklyAssessmentRequest $request)
    {
        $validated = $request->validated();
        $user = $request->user();

        $timezone = $user->timezone ?: 'Asia/Jakarta';
        
        $localLogDate = Carbon::now($timezone)->format('Y-m-d');

        $todayLog = HealthLog::firstOrCreate(
            ['user_id' => $user->id, 'log_date' => $localLogDate],
            ['mood_score' => 5, 'mood_label' => 'neutral', 'stress_level' => 0, 'sleep_hours' => 0, 'sleep_quality' => 0, 'activity_type' => 'sedentary', 'activity_minutes' => 0, 'water_intake_ml' => 0]
        );

        $todayLog->update([
            'gad7_responses' => $validated['gad7_responses'],
            'phq9_responses' => $validated['phq9_responses'],
        ]);

        event(new HealthLogCreated($todayLog));

        $gad7Score = array_sum($validated['gad7_responses']);
        $phq9Score = array_sum($validated['phq9_responses']);

        GenerateWeeklyInsight::dispatch($user, $gad7Score, $phq9Score);

        $user->update(['needs_weekly_assessment' => false]);

        return $this->successResponse(
            null, 
            'Weekly evaluation submitted successfully. AI is generating a comprehensive report...'
        );
    }

    public function update(Request $request, $id)
    {
        $healthLog = HealthLog::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $healthLog->update($request->all());

        return $this->successResponse(
            $healthLog, 
            'Catatan harian berhasil diperbarui!'
        );
    }
}