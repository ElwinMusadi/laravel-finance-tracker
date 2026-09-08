<?php

use App\Enums\CategoryType;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;

test('dashboard uses category metrics', function (): void {
    $user = User::factory()->create();
    $account = Account::factory()->create();
    $income = Category::factory()->create(['type' => CategoryType::Income]);
    Transaction::factory()->create(['category_id' => $income->id, 'account_id' => $account->id, 'amount' => 5000]);
    $this->actingAs($user)->get(route('dashboard'))->assertOk()->assertInertia(fn ($page) => $page->component('dashboard')->where('metrics.monthlyIncome', '5000.00')->where('metrics.netWorth', '5000.00'));
});
