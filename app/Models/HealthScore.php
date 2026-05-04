<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Guarded([])]
class HealthScore extends Model
{
    protected $primaryKey = 'health_log_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected function casts(): array
    {
        return [
            'bmi' => 'decimal:2',
            'composite_score' => 'decimal:2',
        ];
    }

    public function healthLog(): BelongsTo
    {
        return $this->belongsTo(HealthLog::class, 'health_log_id');
    }
}
