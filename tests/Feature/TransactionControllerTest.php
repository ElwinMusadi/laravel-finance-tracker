<?php

use App\Enums\CategoryType;
use App\Models\Account;
use App\Models\Category;
use App\Models\User;

test('transaction index and category transactions are available to authenticated users', function (): void {
    $this->actingAs(User::factory()->create());
    $account = Account::factory()->create();
    $category = Category::factory()->create(['type' => CategoryType::Income]);
    $this->post(route('transactions.store'), ['transaction_date' => now(), 'amount' => 100, 'description' => 'Gaji', 'category_id' => $category->id, 'account_id' => $account->id])->assertRedirect();
    $this->get(route('transactions.index'))->assertOk()->assertInertia(fn ($page) => $page->component('transactions/index')->has('transactions.data', 1));
});

test('transaction store preserves the UTC value converted from a local time picker value', function (): void {
    $this->actingAs(User::factory()->create());
    $account = Account::factory()->create();
    $category = Category::factory()->create(['type' => CategoryType::Income]);

    $this->post(route('transactions.store'), [
        'transaction_date' => '2026-09-08T22:30:00.000Z',
        'amount' => 100,
        'description' => 'Sarapan',
        'category_id' => $category->id,
        'account_id' => $account->id,
    ])->assertRedirect();

    $this->assertDatabaseHas('transactions', [
        'transaction_date' => '2026-09-08 22:30:00',
    ]);
});
