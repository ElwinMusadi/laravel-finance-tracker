<?php

use App\Enums\CategoryType;
use App\Models\Account;
use App\Models\Category;
use App\Models\Contact;
use App\Models\Transaction;
use App\Models\User;
use App\Services\LedgerService;

beforeEach(function (): void {
    $this->actingAs(User::factory()->create());
    $this->account = Account::factory()->create();
    $this->otherAccount = Account::factory()->create();
    $this->contact = Contact::factory()->create();
});

test('requires the appropriate contact and action for all debt and receivable actions', function (string $type, string $action): void {
    $category = Category::factory()->create(['type' => $type]);
    $payload = ['transaction_date' => now()->toDateTimeString(), 'amount' => 100000, 'description' => $action, 'category_id' => $category->id, 'account_id' => $this->account->id, 'contact_id' => $this->contact->id, 'action' => $action];
    $this->post(route('transactions.store'), $payload)->assertRedirect();
    $this->assertDatabaseHas('transactions', ['category_id' => $category->id, 'action' => $action, 'contact_id' => $this->contact->id]);
})->with([['debt', 'receive_loan'], ['debt', 'repay_debt'], ['receivable', 'give_loan'], ['receivable', 'receive_repayment']]);

test('rejects contact data for normal categories and invalid debt actions', function (): void {
    $income = Category::factory()->create(['type' => CategoryType::Income]);
    $this->post(route('transactions.store'), ['transaction_date' => now(), 'amount' => 1, 'description' => 'Gaji', 'category_id' => $income->id, 'account_id' => $this->account->id, 'contact_id' => $this->contact->id])->assertSessionHasErrors('category_id');
    $debt = Category::factory()->create(['type' => CategoryType::Debt]);
    $this->post(route('transactions.store'), ['transaction_date' => now(), 'amount' => 1, 'description' => 'Salah', 'category_id' => $debt->id, 'account_id' => $this->account->id, 'contact_id' => $this->contact->id, 'action' => 'give_loan'])->assertSessionHasErrors('action');
});

test('requires two distinct accounts for a transfer', function (): void {
    $transfer = Category::factory()->create(['type' => CategoryType::Transfer]);
    $payload = ['transaction_date' => now(), 'amount' => 1000, 'description' => 'Pindah dana', 'category_id' => $transfer->id, 'account_id' => $this->account->id];
    $this->post(route('transactions.store'), $payload)->assertSessionHasErrors('transfer_account_id');
    $this->post(route('transactions.store'), [...$payload, 'transfer_account_id' => $this->otherAccount->id])->assertRedirect();
});

test('calculates account balances and net worth from categories and actions', function (): void {
    $income = Category::factory()->create(['type' => CategoryType::Income]);
    $expense = Category::factory()->create(['type' => CategoryType::Expense]);
    $debt = Category::factory()->create(['type' => CategoryType::Debt]);
    $receivable = Category::factory()->create(['type' => CategoryType::Receivable]);
    Transaction::factory()->create(['category_id' => $income->id, 'account_id' => $this->account->id, 'amount' => 1000]);
    Transaction::factory()->create(['category_id' => $expense->id, 'account_id' => $this->account->id, 'amount' => 200]);
    Transaction::factory()->create(['category_id' => $debt->id, 'account_id' => $this->account->id, 'contact_id' => $this->contact->id, 'action' => 'receive_loan', 'amount' => 500]);
    Transaction::factory()->create(['category_id' => $receivable->id, 'account_id' => $this->account->id, 'contact_id' => $this->contact->id, 'action' => 'give_loan', 'amount' => 300]);
    $ledger = app(LedgerService::class);
    expect($ledger->getAccountBalance($this->account))->toBe('1000.00')->and($ledger->getTotalDebt())->toBe('500.00')->and($ledger->getTotalReceivable())->toBe('300.00');
});
