<?php

use App\Models\User;

test('appearance page requires authentication', function (): void {
    $this->get(route('appearance.edit'))->assertRedirect(route('login'));
});

test('appearance page is displayed for authenticated users', function (): void {
    $this->actingAs(User::factory()->create())
        ->get(route('appearance.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('settings/appearance'));
});

test('valid font family cookie is rendered on the application root', function (): void {
    $this->withUnencryptedCookie('font_family', 'inter')
        ->get(route('home'))
        ->assertOk()
        ->assertSee('data-font-family="inter"', false);
});

test('invalid font family cookie falls back to IBM Plex Sans', function (): void {
    $this->withUnencryptedCookie('font_family', 'invalid-font')
        ->get(route('home'))
        ->assertOk()
        ->assertSee('data-font-family="ibm-plex"', false);
});
