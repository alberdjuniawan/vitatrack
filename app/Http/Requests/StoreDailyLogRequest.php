<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDailyLogRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'log_date' => ['required', 'date', 'before_or_equal:today'],
            'mood_score' => ['required', 'integer', 'between:1,10'],
            'mood_label' => ['required', Rule::in(['happy', 'sad', 'anxious', 'angry', 'calm', 'overwhelmed', 'neutral'])],
            'stress_level' => ['required', 'integer', 'between:0,4'],
            'sleep_hours' => ['required', 'numeric', 'between:0,24'],
            'sleep_quality' => ['required', 'integer', 'between:0,3'],
            'activity_type' => ['required', Rule::in(['sedentary', 'walking', 'running', 'cycling', 'gym', 'sport', 'other'])],
            'activity_minutes' => ['required', 'integer', 'min:0'],
            'water_intake_ml' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}