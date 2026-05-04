<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Guarded(['id'])]
class HealthLog extends Model
{
    use HasUlids;
    
    protected function casts(): array
    {
        return [
            'log_date' => 'date',
            'sleep_hours' => 'decimal:1',
            'activity_met' => 'decimal:2',
            
            'phq9_responses' => 'array',
            'gad7_responses' => 'array',
            
            'mood_score' => 'integer',
            'stress_level' => 'integer',
            'sleep_quality' => 'integer',
            'activity_minutes' => 'integer',
            'water_intake_ml' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function healthScore(): HasOne
    {
        return $this->hasOne(HealthScore::class);
    }
}