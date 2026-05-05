<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255', 
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'height_cm' => 'nullable|numeric|min:50|max:300',
            'weight_kg' => 'nullable|numeric|min:20|max:500',
            'existing_conditions' => 'nullable|array',
            'timezone' => 'nullable|timezone',
        ]);

        $user = $request->user();
        $user->update($validated);

        return $this->successResponse($user, 'Profile updated successfully.');
    }
}