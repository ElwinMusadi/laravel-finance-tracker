<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transaction>
 */
class TransactionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'transaction_date' => fake()->dateTimeBetween('-1 month', 'now'),
            'amount' => fake()->randomFloat(2, 10000, 5000000),
            'description' => fake()->sentence(3),
            'category_id' => Category::factory(),
            'account_id' => Account::factory(),
            'transfer_account_id' => null,
            'contact_id' => null,
            'action' => null,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
