<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWeeklyAssessmentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'phq9_responses' => ['required', 'array', 'size:9'],
            'phq9_responses.*' => ['integer', 'between:0,3'],
            'gad7_responses' => ['required', 'array', 'size:7'],
            'gad7_responses.*' => ['integer', 'between:0,3'],
        ];
    }

    public function attributes(): array
    {
        return [
            'phq9_responses' => 'PHQ-9 questionnaire',
            'gad7_responses' => 'GAD-7 questionnaire',
        ];
    }
}