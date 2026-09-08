<?php

use App\Enums\CategoryType;
use App\Models\Account;
use App\Models\Category;
use App\Models\Contact;
use App\Models\Transaction;
use App\Models\User;

test('contacts with debt or receivable transactions cannot be deleted', function (): void {
    $this->actingAs(User::factory()->create());
    $contact = Contact::factory()->create();
    $account = Account::factory()->create();
    $category = Category::factory()->create(['type' => CategoryType::Debt]);
    Transaction::factory()->create(['category_id' => $category->id, 'account_id' => $account->id, 'contact_id' => $contact->id, 'action' => 'receive_loan']);
    $this->delete(route('contacts.destroy', $contact))->assertSessionHas('error');
});
