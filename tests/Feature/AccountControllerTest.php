<?php

use App\Models\Account;
use App\Models\User;

test('accounts use free-form account type labels and create system opening balances', function (): void {
    $this->actingAs(User::factory()->create());
    $this->post(route('accounts.store'), ['name' => 'Bank', 'account_type' => 'Bank', 'opening_balance' => 1000])->assertRedirect(route('accounts.index'));
    $account = Account::where('name', 'Bank')->firstOrFail();
    expect($account->accountType?->name)->toBe('Bank');
    $this->assertDatabaseHas('transactions', ['account_id' => $account->id, 'description' => 'Saldo Awal']);
});
