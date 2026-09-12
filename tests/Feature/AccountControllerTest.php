<?php

use App\Models\Account;
use App\Models\User;

test('accounts use free-form account type labels and create system opening balances', function (): void {
    $this->actingAs(User::factory()->create());
    $this->post(route('accounts.store'), ['name' => 'Bank', 'account_type' => 'Bank', 'opening_balance' => 1000])->assertRedirect(route('accounts.index'));
    $account = Account::where('name', 'Bank')->firstOrFail();
    expect($account->accountType?->name)->toBe('Bank');
    expect($account->sort_order)->toBe(1);
    $this->assertDatabaseHas('transactions', ['account_id' => $account->id, 'description' => 'Saldo Awal']);
});

test('account reorder persists the submitted order', function (): void {
    $this->actingAs(User::factory()->create());
    $first = Account::factory()->create(['name' => 'Pertama', 'sort_order' => 1]);
    $second = Account::factory()->create(['name' => 'Kedua', 'sort_order' => 2]);
    $third = Account::factory()->create(['name' => 'Ketiga', 'sort_order' => 3]);

    $this->put(route('accounts.reorder'), [
        'account_ids' => [$third->id, $first->id, $second->id],
    ])->assertRedirect(route('accounts.index'));

    expect(Account::ordered()->pluck('id')->all())->toBe([
        $third->id,
        $first->id,
        $second->id,
    ]);
});

test('account reorder rejects an incomplete account list', function (): void {
    $this->actingAs(User::factory()->create());
    $first = Account::factory()->create(['sort_order' => 1]);
    Account::factory()->create(['sort_order' => 2]);

    $this->from(route('accounts.index'))
        ->put(route('accounts.reorder'), ['account_ids' => [$first->id]])
        ->assertSessionHasErrors('account_ids')
        ->assertRedirect(route('accounts.index'));
});

test('account index and transaction index use the configured account order', function (): void {
    $this->actingAs(User::factory()->create());
    Account::factory()->create(['name' => 'Zeta', 'sort_order' => 1]);
    Account::factory()->create(['name' => 'Alpha', 'sort_order' => 2]);

    $this->get(route('accounts.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('accounts.0.name', 'Zeta')
            ->where('accounts.1.name', 'Alpha'));

    $this->get(route('transactions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('accounts.0.name', 'Zeta')
            ->where('accounts.1.name', 'Alpha'));
});
