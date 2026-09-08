<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard and see metrics', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    // Setup some data to test LedgerService aggregation on dashboard
    $asset = \App\Models\Account::factory()->create(['type' => 'asset']);
    $revenue = \App\Models\Account::factory()->create(['type' => 'revenue']);
    $expense = \App\Models\Account::factory()->create(['type' => 'expense']);

    \App\Models\Transaction::factory()->create([
        'source_account_id' => $revenue->id,
        'destination_account_id' => $asset->id,
        'amount' => 5000,
        'transaction_date' => now(),
    ]);

    \App\Models\Transaction::factory()->create([
        'source_account_id' => $asset->id,
        'destination_account_id' => $expense->id,
        'amount' => 1000,
        'transaction_date' => now(),
    ]);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->has('metrics')
        ->has('recentTransactions')
        ->where('metrics.monthlyIncome', '5000.00')
        ->where('metrics.monthlyExpense', '1000.00')
        ->where('metrics.totalAssets', '4000.00')
    );
});
