<?php

use App\Models\Account;
use App\Models\Contact;
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

test('index renders accounts list with active contacts', function () {
    $activeContact = Contact::factory()->create(['is_active' => true]);
    $inactiveContact = Contact::factory()->create(['is_active' => false]);
    $account = Account::factory()->create();

    $response = get(route('accounts.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('accounts/index')
        ->has('accounts', 1)
        ->has('contacts', 1)
        ->where('contacts.0.id', $activeContact->id)
    );
});

test('store creates account without opening balance', function () {
    $response = post(route('accounts.store'), [
        'name' => 'Bank BCA',
        'type' => 'asset',
        'is_active' => true,
    ]);

    $response->assertRedirect(route('accounts.index'));
    assertDatabaseHas('accounts', [
        'name' => 'Bank BCA',
        'type' => 'asset',
    ]);
    assertDatabaseMissing('transactions', [
        'description' => 'Opening Balance',
    ]);
});

test('store creates account and opening balance transaction', function () {
    $response = post(route('accounts.store'), [
        'name' => 'Cash',
        'type' => 'asset',
        'is_active' => true,
        'opening_balance' => 1000000,
    ]);

    $response->assertRedirect(route('accounts.index'));
    assertDatabaseHas('accounts', [
        'name' => 'Cash',
        'type' => 'asset',
    ]);
    
    $account = Account::where('name', 'Cash')->first();
    $equityAccount = Account::where('type', 'equity')->where('name', 'Opening Balance')->first();
    
    assertDatabaseHas('transactions', [
        'description' => 'Opening Balance',
        'amount' => 1000000,
        'source_account_id' => $equityAccount->id,
        'destination_account_id' => $account->id,
    ]);
});

test('update modifies account', function () {
    $account = Account::factory()->create(['name' => 'Old Name']);

    $response = put(route('accounts.update', $account), [
        'name' => 'New Name',
        'type' => 'asset',
        'is_active' => false,
    ]);

    $response->assertRedirect(route('accounts.index'));
    assertDatabaseHas('accounts', [
        'id' => $account->id,
        'name' => 'New Name',
        'is_active' => false,
    ]);
});

test('destroy deletes account if balance is zero', function () {
    $account = Account::factory()->create();

    $response = delete(route('accounts.destroy', $account));
    
    $response->assertRedirect(route('accounts.index'));
    assertDatabaseMissing('accounts', [
        'id' => $account->id,
    ]);
});

test('destroy prevents deletion if account has non-zero balance', function () {
    $account = Account::factory()->create();
    $equity = Account::factory()->create(['type' => 'equity']);
    
    Transaction::factory()->create([
        'source_account_id' => $equity->id,
        'destination_account_id' => $account->id,
        'amount' => 500,
    ]);

    $response = delete(route('accounts.destroy', $account));
    
    $response->assertRedirect(route('accounts.index'));
    $response->assertSessionHas('error', 'Cannot delete account with existing transactions. Deactivate it instead.');
    
    assertDatabaseHas('accounts', [
        'id' => $account->id,
    ]);
});
