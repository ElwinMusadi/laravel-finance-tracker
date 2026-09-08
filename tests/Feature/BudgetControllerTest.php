<?php

use App\Models\Account;
use App\Models\Budget;
use App\Models\User;
use Illuminate\Support\Carbon;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\post;
use function Pest\Laravel\put;

beforeEach(function () {
    $this->user = User::factory()->create();
    actingAs($this->user);
});

test('index renders budgets list for specific month', function () {
    $expenseAccount = Account::factory()->create(['type' => 'expense']);
    $nonExpenseAccount = Account::factory()->create(['type' => 'asset']);

    $month = Carbon::now()->format('Y-m');
    Budget::factory()->create([
        'account_id' => $expenseAccount->id,
        'period_month' => Carbon::now()->startOfMonth(),
        'amount' => 500000,
    ]);

    $response = get(route('budgets.index', ['month' => $month]));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('budgets/index')
        ->has('budgetData', 1)
        ->where('budgetData.0.account.id', $expenseAccount->id)
    );
});

test('store creates or updates budget', function () {
    $expenseAccount = Account::factory()->create(['type' => 'expense']);
    $month = '2026-08';

    // Create
    $response = $this->from(route('budgets.index', ['month' => $month]))->post(route('budgets.store'), [
        'account_id' => $expenseAccount->id,
        'period_month' => $month,
        'amount' => 1000000,
    ]);

    $response->assertRedirect(route('budgets.index', ['month' => $month]));
    assertDatabaseHas('budgets', [
        'account_id' => $expenseAccount->id,
        'period_month' => '2026-08-01 00:00:00',
        'amount' => 1000000,
    ]);

    // Update existing
    $budget = Budget::where('account_id', $expenseAccount->id)->first();
    
    $response = $this->from(route('budgets.index', ['month' => $month]))->put(route('budgets.update', $budget), [
        'account_id' => $expenseAccount->id,
        'period_month' => $month,
        'amount' => 2000000,
    ]);

    $response->assertRedirect(route('budgets.index', ['month' => $month]));
    assertDatabaseHas('budgets', [
        'id' => $budget->id,
        'account_id' => $expenseAccount->id,
        'period_month' => '2026-08-01 00:00:00',
        'amount' => 2000000,
    ]);
});

test('store rejects non-expense accounts', function () {
    $assetAccount = Account::factory()->create(['type' => 'asset']);
    
    $response = post(route('budgets.store'), [
        'account_id' => $assetAccount->id,
        'period_month' => '2026-08',
        'amount' => 1000000,
    ]);

    $response->assertSessionHasErrors(['account_id']);
});

test('destroy deletes budget', function () {
    $budget = Budget::factory()->create();
    
    $response = $this->from(route('budgets.index'))->delete(route('budgets.destroy', $budget));
    
    $response->assertRedirect(route('budgets.index'));
    assertDatabaseMissing('budgets', [
        'id' => $budget->id,
    ]);
});
