<?php

use App\Models\Contact;
use App\Models\Account;
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

test('index renders contacts list', function () {
    $contact = Contact::factory()->create();

    $response = get(route('contacts.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('contacts/index')
        ->has('contacts', 1)
    );
});

test('store creates contact', function () {
    $response = post(route('contacts.store'), [
        'name' => 'John Doe',
        'is_active' => true,
    ]);

    $response->assertRedirect(route('contacts.index'));
    assertDatabaseHas('contacts', [
        'name' => 'John Doe',
        'is_active' => true,
    ]);
});

test('update modifies contact', function () {
    $contact = Contact::factory()->create(['name' => 'Old Name']);

    $response = put(route('contacts.update', $contact), [
        'name' => 'New Name',
        'is_active' => false,
    ]);

    $response->assertRedirect(route('contacts.index'));
    assertDatabaseHas('contacts', [
        'id' => $contact->id,
        'name' => 'New Name',
        'is_active' => false,
    ]);
});

test('destroy deletes contact if no linked accounts', function () {
    $contact = Contact::factory()->create();

    $response = delete(route('contacts.destroy', $contact));
    
    $response->assertRedirect(route('contacts.index'));
    assertDatabaseMissing('contacts', [
        'id' => $contact->id,
    ]);
});

test('destroy prevents deletion if contact has linked accounts', function () {
    $contact = Contact::factory()->create();
    Account::factory()->create(['contact_id' => $contact->id]);

    $response = delete(route('contacts.destroy', $contact));
    
    $response->assertRedirect(route('contacts.index'));
    $response->assertSessionHas('error', 'Cannot delete contact because it has linked accounts. Deactivate it instead.');
    
    assertDatabaseHas('contacts', [
        'id' => $contact->id,
    ]);
});
