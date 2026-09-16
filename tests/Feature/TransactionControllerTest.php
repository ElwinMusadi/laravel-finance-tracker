<?php

use App\Enums\CategoryType;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;

test('transaction index and category transactions are available to authenticated users', function (): void {
    $this->actingAs(User::factory()->create());
    $account = Account::factory()->create();
    $category = Category::factory()->create(['type' => CategoryType::Income]);
    $this->post(route('transactions.store'), ['transaction_date' => now(), 'amount' => 100, 'description' => 'Gaji', 'category_id' => $category->id, 'account_id' => $account->id])->assertRedirect();
    $this->get(route('transactions.index'))->assertOk()->assertInertia(fn ($page) => $page->component('transactions/index')->has('transactions.data', 1));
});

test('transaction index includes current balances for active accounts', function (): void {
    $this->actingAs(User::factory()->create());
    $account = Account::factory()->create(['name' => 'Bank Utama']);
    $income = Category::factory()->create(['type' => CategoryType::Income]);
    $expense = Category::factory()->create(['type' => CategoryType::Expense]);
    Transaction::factory()->create(['category_id' => $income->id, 'account_id' => $account->id, 'amount' => 1000]);
    Transaction::factory()->create(['category_id' => $expense->id, 'account_id' => $account->id, 'amount' => 250]);

    $this->get(route('transactions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('transactions/index')
            ->has('accounts', 1)
            ->where('accounts.0.name', 'Bank Utama')
            ->where('accounts.0.balance', '750.00'));
});

test('transaction index applies transfers to source and destination account balances', function (): void {
    $this->actingAs(User::factory()->create());
    $source = Account::factory()->create(['name' => 'Akun A Sumber', 'sort_order' => 1]);
    $destination = Account::factory()->create(['name' => 'Akun B Tujuan', 'sort_order' => 2]);
    $income = Category::factory()->create(['type' => CategoryType::Income]);
    $transfer = Category::factory()->create(['type' => CategoryType::Transfer]);
    Transaction::factory()->create(['category_id' => $income->id, 'account_id' => $source->id, 'amount' => 1000]);
    Transaction::factory()->create([
        'category_id' => $transfer->id,
        'account_id' => $source->id,
        'transfer_account_id' => $destination->id,
        'amount' => 300,
    ]);

    $this->get(route('transactions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('accounts.0.name', 'Akun A Sumber')
            ->where('accounts.0.balance', '700.00')
            ->where('accounts.1.name', 'Akun B Tujuan')
            ->where('accounts.1.balance', '300.00'));
});

test('transaction index includes zero balances and excludes inactive accounts', function (): void {
    $this->actingAs(User::factory()->create());
    Account::factory()->create(['name' => 'Akun Aktif', 'is_active' => true]);
    Account::factory()->create(['name' => 'Akun Nonaktif', 'is_active' => false]);

    $this->get(route('transactions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('accounts', 1)
            ->where('accounts.0.name', 'Akun Aktif')
            ->where('accounts.0.balance', '0.00'));
});

test('transaction store preserves the local date and time selected in Asia Makassar', function (): void {
    $this->actingAs(User::factory()->create());
    $account = Account::factory()->create();
    $category = Category::factory()->create(['type' => CategoryType::Expense]);

    $this->post(route('transactions.store'), [
        'transaction_date' => '2026-09-01T06:30',
        'amount' => 103000,
        'description' => 'Pulsa Listrik',
        'category_id' => $category->id,
        'account_id' => $account->id,
    ])->assertRedirect();

    $this->assertDatabaseHas('transactions', [
        'transaction_date' => '2026-09-01 06:30:00',
    ]);
});
