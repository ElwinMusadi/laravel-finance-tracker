<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
            'type' => 'expense',
            'budget_limit' => fake()->randomFloat(2, 100000, 5000000),
            'icon' => null,
            'color' => null,
            'is_active' => true,
        ];
    }
}
