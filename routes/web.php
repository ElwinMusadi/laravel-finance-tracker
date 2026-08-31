<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\BudgetController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('contacts', ContactController::class)->except(['create', 'show', 'edit']);
    Route::resource('accounts', AccountController::class)->except(['create', 'show', 'edit']);
    Route::resource('transactions', TransactionController::class)->except(['create', 'show', 'edit']);
    Route::resource('budgets', BudgetController::class)->except(['create', 'show', 'edit']);
});

require __DIR__.'/settings.php';
