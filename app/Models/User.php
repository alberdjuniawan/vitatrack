<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids; 
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasUlids; 

    protected $fillable = [
        'name',
        'email',
        'password',
        'date_of_birth',
        'gender',
        'height_cm',
        'weight_kg',
        'existing_conditions',
        'timezone',
        'needs_weekly_assessment',
    ];
    protected $hidden = ['password', 'remember_token'];
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'existing_conditions' => 'array',
            'needs_weekly_assessment' => 'boolean',
        ];
    }

    public function healthLogs()
    {
        return $this->hasMany(HealthLog::class);
    }

    public function insights()
    {
        return $this->hasMany(Insight::class);
    }
}