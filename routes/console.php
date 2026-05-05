<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Log;
use App\Models\User;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    User::query()->update(['needs_weekly_assessment' => true]);
    
    Log::info('Weekly cron: The weekly assessment button (PHQ-9/GAD-7) has been re-enabled for all users.');
})->weeklyOn(0, '00:01')->name('reset-weekly-assessment')->withoutOverlapping();