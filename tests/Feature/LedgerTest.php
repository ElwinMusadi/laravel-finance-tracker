<?php

use App\Enums\CategoryType;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Services\LedgerService;

test('ledger applies income expense and transfers to account balances', function (): void {
    $first = Account::factory()->create();
    $second = Account::factory()->create();
    $income = Category::factory()->create(['type' => CategoryType::Income]);
    $expense = Category::factory()->create(['type' => CategoryType::Expense]);
    $transfer = Category::factory()->create(['type' => CategoryType::Transfer]);
    Transaction::factory()->create(['category_id' => $income->id, 'account_id' => $first->id, 'amount' => 1000]);
    Transaction::factory()->create(['category_id' => $expense->id, 'account_id' => $first->id, 'amount' => 200]);
    Transaction::factory()->create(['category_id' => $transfer->id, 'account_id' => $first->id, 'transfer_account_id' => $second->id, 'amount' => 300]);
    $ledger = app(LedgerService::class);
    expect($ledger->getAccountBalance($first))->toBe('500.00')->and($ledger->getAccountBalance($second))->toBe('300.00');
});
