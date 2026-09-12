<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('contacts', ContactController::class)->except(['create', 'show', 'edit']);
    Route::put('accounts/reorder', [AccountController::class, 'reorder'])->name('accounts.reorder');
    Route::resource('accounts', AccountController::class)->except(['create', 'show', 'edit']);
    Route::resource('categories', CategoryController::class)->except(['create', 'show', 'edit']);
    Route::resource('transactions', TransactionController::class)->except(['create', 'show', 'edit']);
    Route::get('budgets', [BudgetController::class, 'index'])->name('budgets.index');
    Route::patch('budgets/{category}', [BudgetController::class, 'update'])->name('budgets.update');
    Route::delete('budgets/{category}', [BudgetController::class, 'destroy'])->name('budgets.destroy');
});

require __DIR__.'/settings.php';
