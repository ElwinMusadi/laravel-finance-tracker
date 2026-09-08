<?php

use App\Enums\CategoryType;
use App\Models\Category;
use App\Models\User;

test('budget is stored as the expense category budget limit', function (): void {
    $this->actingAs(User::factory()->create());
    $category = Category::factory()->create(['type' => CategoryType::Expense, 'budget_limit' => null]);
    $this->patch(route('budgets.update', $category), ['budget_limit' => 500000])->assertRedirect();
    expect($category->fresh()->budget_limit)->toBe('500000.00');
    $this->delete(route('budgets.destroy', $category))->assertRedirect();
    expect($category->fresh()->budget_limit)->toBeNull();
});
