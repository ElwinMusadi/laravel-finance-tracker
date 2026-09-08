<?php

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;

beforeEach(function (): void {
    $this->actingAs(User::factory()->create());
});

test('creates, updates, and protects used categories', function (): void {
    $this->post(route('categories.store'), ['name' => 'Belanja', 'type' => 'expense', 'budget_limit' => 500000])->assertRedirect(route('categories.index'));
    $category = Category::firstOrFail();
    $this->patch(route('categories.update', $category), ['name' => 'Belanja Harian', 'type' => 'expense', 'budget_limit' => 600000])->assertRedirect(route('categories.index'));
    expect($category->fresh()->budget_limit)->toBe('600000.00');
    Transaction::factory()->for($category)->create();
    $this->delete(route('categories.destroy', $category))->assertSessionHas('error');
});

test('rejects system categories and budgets outside expense categories', function (): void {
    $this->post(route('categories.store'), ['name' => 'Transfer', 'type' => 'transfer'])->assertSessionHasErrors('type');
    $this->post(route('categories.store'), ['name' => 'Gaji', 'type' => 'income', 'budget_limit' => 100])->assertSessionHasErrors('budget_limit');
});
