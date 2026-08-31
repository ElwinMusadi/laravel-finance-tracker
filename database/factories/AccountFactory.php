<?php

namespace Database\Factories;

use App\Models\Account;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Account>
 */
class AccountFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->word(),
            'type' => 'asset',
            'contact_id' => null,
            'icon' => null,
            'color' => null,
            'is_active' => true,
        ];
    }

    /**
     * Create an asset account (bank, cash, e-wallet).
     */
    public function asset(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => 'asset',
        ]);
    }

    /**
     * Create a liability account (debt).
     */
    public function liability(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => 'liability',
        ]);
    }

    /**
     * Create an equity account (opening balance).
     */
    public function equity(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => 'equity',
        ]);
    }

    /**
     * Create a revenue account (income category).
     */
    public function revenue(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => 'revenue',
        ]);
    }

    /**
     * Create an expense account (expense category).
     */
    public function expense(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => 'expense',
        ]);
    }

    /**
     * Indicate the account is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => false,
        ]);
    }
}
