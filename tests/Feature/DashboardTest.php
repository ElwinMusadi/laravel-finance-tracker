<?php

use App\Enums\CategoryType;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;

test('dashboard uses category metrics', function (): void {
    $user = User::factory()->create();
    $account = Account::factory()->create();
    $income = Category::factory()->create(['type' => CategoryType::Income]);
    Transaction::factory()->create(['category_id' => $income->id, 'account_id' => $account->id, 'amount' => 5000, 'transaction_date' => now()]);
    $this->actingAs($user)->get(route('dashboard'))->assertOk()->assertInertia(fn ($page) => $page->component('dashboard')->where('metrics.monthlyIncome', '5000.00')->where('metrics.netWorth', '5000.00'));
});

test('dashboard includes expenses entered during the first local hour of the month', function (): void {
    $this->travelTo('2026-09-12 12:00:00');
    $user = User::factory()->create();
    $account = Account::factory()->create();
    $expense = Category::factory()->create(['type' => CategoryType::Expense]);
    Transaction::factory()->create([
        'category_id' => $expense->id,
        'account_id' => $account->id,
        'amount' => 103000,
        'transaction_date' => '2026-09-01 06:30:00',
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('metrics.monthlyExpense', '103000.00'));
});

test('dashboard provides daily cash flow for the current month', function (): void {
    $this->travelTo('2026-09-12 12:00:00');
    $user = User::factory()->create();
    $account = Account::factory()->create();
    $income = Category::factory()->create(['type' => CategoryType::Income]);
    $expense = Category::factory()->create(['type' => CategoryType::Expense]);
    Transaction::factory()->create([
        'category_id' => $income->id,
        'account_id' => $account->id,
        'amount' => 500000,
        'transaction_date' => '2026-09-03 09:00:00',
    ]);
    Transaction::factory()->create([
        'category_id' => $expense->id,
        'account_id' => $account->id,
        'amount' => 125000,
        'transaction_date' => '2026-09-03 18:00:00',
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('cashFlowCurrentMonth.2', [
                'month' => '3 Sep',
                'income' => 500000,
                'expense' => 125000,
            ]));
});
