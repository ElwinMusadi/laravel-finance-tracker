<?php

use App\Enums\CategoryType;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;

test('budget is stored as the expense category budget limit', function (): void {
    $this->actingAs(User::factory()->create());
    $category = Category::factory()->create(['type' => CategoryType::Expense, 'budget_limit' => null]);
    $this->patch(route('budgets.update', $category), ['budget_limit' => 500000])->assertRedirect();
    expect($category->fresh()->budget_limit)->toBe('500000.00');
    $this->delete(route('budgets.destroy', $category))->assertRedirect();
    expect($category->fresh()->budget_limit)->toBeNull();
});

test('budget includes an expense entered during the first local hour of the month', function (): void {
    $this->travelTo('2026-09-12 12:00:00');
    $this->actingAs(User::factory()->create());
    $account = Account::factory()->create();
    $category = Category::factory()->create([
        'type' => CategoryType::Expense,
        'budget_limit' => 206000,
    ]);
    Transaction::factory()->create([
        'category_id' => $category->id,
        'account_id' => $account->id,
        'amount' => 103000,
        'transaction_date' => '2026-09-01 06:30:00',
    ]);

    $this->get(route('budgets.index', ['month' => '2026-09']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('budgetData.0.actual_amount', '103000.00'));
});

test('budget can be ordered by highest realization percentage', function (): void {
    $this->actingAs(User::factory()->create());
    $account = Account::factory()->create();
    $overBudget = Category::factory()->create([
        'name' => 'Over Budget',
        'type' => CategoryType::Expense,
        'budget_limit' => 100,
    ]);
    $halfUsed = Category::factory()->create([
        'name' => 'Setengah',
        'type' => CategoryType::Expense,
        'budget_limit' => 200,
    ]);
    Category::factory()->create([
        'name' => 'Belum Dipakai',
        'type' => CategoryType::Expense,
        'budget_limit' => 100,
    ]);
    Transaction::factory()->create([
        'category_id' => $overBudget->id,
        'account_id' => $account->id,
        'amount' => 150,
        'transaction_date' => now(),
    ]);
    Transaction::factory()->create([
        'category_id' => $halfUsed->id,
        'account_id' => $account->id,
        'amount' => 100,
        'transaction_date' => now(),
    ]);

    $this->get(route('budgets.index', ['sort' => 'realization_desc']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.sort', 'realization_desc')
            ->where('budgetData.0.category.name', 'Over Budget')
            ->where('budgetData.0.realization_percentage', 150)
            ->where('budgetData.1.category.name', 'Setengah')
            ->where('budgetData.2.category.name', 'Belum Dipakai'));
});

test('budget rejects invalid sort filters', function (): void {
    $this->actingAs(User::factory()->create())
        ->get(route('budgets.index', ['sort' => 'invalid']))
        ->assertSessionHasErrors('sort');
});

test('budget can be ordered by lowest realization percentage including zero percent', function (): void {
    $this->actingAs(User::factory()->create());
    $account = Account::factory()->create();
    $unused = Category::factory()->create([
        'name' => 'A Belum Dipakai',
        'type' => CategoryType::Expense,
        'budget_limit' => 100,
    ]);
    $halfUsed = Category::factory()->create([
        'name' => 'B Setengah',
        'type' => CategoryType::Expense,
        'budget_limit' => 200,
    ]);
    Category::factory()->create([
        'name' => 'C Tanpa Limit',
        'type' => CategoryType::Expense,
        'budget_limit' => null,
    ]);
    Transaction::factory()->create([
        'category_id' => $halfUsed->id,
        'account_id' => $account->id,
        'amount' => 100,
        'transaction_date' => now(),
    ]);

    $this->get(route('budgets.index', ['sort' => 'realization_asc']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('budgetData.0.category.id', $unused->id)
            ->where('budgetData.0.realization_percentage', 0)
            ->where('budgetData.1.category.id', $halfUsed->id)
            ->where('budgetData.2.category.name', 'C Tanpa Limit')
            ->where('budgetData.2.realization_percentage', null));
});
