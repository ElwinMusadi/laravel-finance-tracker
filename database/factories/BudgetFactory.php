<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Budget;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Budget>
 */
class BudgetFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'account_id' => Account::factory()->expense(),
            'period_month' => Carbon::now()->startOfMonth()->toDateString(),
            'amount' => fake()->randomFloat(2, 100000, 5000000),
        ];
    }
}
