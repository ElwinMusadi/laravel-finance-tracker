<?php

use App\Models\Account;
use App\Models\Transaction;
use App\Models\User;
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

test('index renders transactions list and handles filters', function () {
    $account = Account::factory()->create(['type' => 'asset']);
    Transaction::factory()->create([
        'source_account_id' => $account->id,
        'transaction_date' => '2026-08-15 10:00:00'
    ]);

    $response = get(route('transactions.index', ['month' => '2026-08', 'account_id' => $account->id]));
    
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('transactions/index')
        ->has('transactions.data', 1)
        ->has('accounts')
    );
});

test('store creates transaction and enforces account type matrix', function () {
    $revenue = Account::factory()->create(['type' => 'revenue']);
    $asset = Account::factory()->create(['type' => 'asset']);

    // Valid: Revenue -> Asset (Income)
    $response = $this->from(route('transactions.index'))->post(route('transactions.store'), [
        'transaction_date' => now()->toIso8601String(),
        'amount' => 500000,
        'description' => 'Salary',
        'source_account_id' => $revenue->id,
        'destination_account_id' => $asset->id,
    ]);

    $response->assertRedirect(route('transactions.index'));
    assertDatabaseHas('transactions', [
        'description' => 'Salary',
        'amount' => 500000,
        'source_account_id' => $revenue->id,
        'destination_account_id' => $asset->id,
    ]);
});

test('store prevents invalid account type matrix', function () {
    $revenue = Account::factory()->create(['type' => 'revenue']);
    $expense = Account::factory()->create(['type' => 'expense']);

    // Invalid: Revenue -> Expense (Not allowed by matrix)
    $response = post(route('transactions.store'), [
        'transaction_date' => now()->toIso8601String(),
        'amount' => 500000,
        'description' => 'Invalid',
        'source_account_id' => $revenue->id,
        'destination_account_id' => $expense->id,
    ]);

    $response->assertSessionHasErrors(['destination_account_id']);
    assertDatabaseMissing('transactions', [
        'description' => 'Invalid',
    ]);
});

test('store prevents same source and destination account', function () {
    $asset = Account::factory()->create(['type' => 'asset']);

    $response = post(route('transactions.store'), [
        'transaction_date' => now()->toIso8601String(),
        'amount' => 1000,
        'description' => 'Same Account',
        'source_account_id' => $asset->id,
        'destination_account_id' => $asset->id,
    ]);

    $response->assertSessionHasErrors(['destination_account_id']);
});

test('update modifies transaction', function () {
    $asset1 = Account::factory()->create(['type' => 'asset']);
    $asset2 = Account::factory()->create(['type' => 'asset']);
    
    $transaction = Transaction::factory()->create([
        'source_account_id' => $asset1->id,
        'destination_account_id' => $asset2->id,
        'amount' => 1000,
    ]);

    $response = $this->from(route('transactions.index'))->put(route('transactions.update', $transaction), [
        'transaction_date' => now()->toIso8601String(),
        'amount' => 2000,
        'description' => 'Updated',
        'source_account_id' => $asset1->id,
        'destination_account_id' => $asset2->id,
    ]);

    $response->assertRedirect(route('transactions.index'));
    assertDatabaseHas('transactions', [
        'id' => $transaction->id,
        'amount' => 2000,
        'description' => 'Updated',
    ]);
});

test('destroy deletes transaction', function () {
    $transaction = Transaction::factory()->create();

    $response = $this->from(route('transactions.index'))->delete(route('transactions.destroy', $transaction));
    
    $response->assertRedirect(route('transactions.index'));
    assertDatabaseMissing('transactions', [
        'id' => $transaction->id,
    ]);
});
