<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Models\Account;
use App\Models\Category;
use App\Models\Contact;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Transaction::with(['account', 'transferAccount', 'category', 'contact'])->latest('transaction_date')->latest('id');

        if ($request->filled('month')) {
            $month = Carbon::createFromFormat('Y-m', $request->string('month')->toString());
            $query->whereBetween('transaction_date', [$month->copy()->startOfMonth(), $month->copy()->endOfMonth()]);
        }

        if ($request->filled('account_id')) {
            $query->where(fn ($query) => $query->where('account_id', $request->integer('account_id'))->orWhere('transfer_account_id', $request->integer('account_id')));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        return Inertia::render('transactions/index', [
            'transactions' => $query->paginate(25)->withQueryString(),
            'accounts' => Account::active()->orderBy('name')->get(),
            'categories' => Category::active()->orderBy('type')->orderBy('name')->get(),
            'contacts' => Contact::active()->orderBy('name')->get(),
            'filters' => $request->only(['month', 'account_id', 'category_id', 'search']),
        ]);
    }

    public function store(StoreTransactionRequest $request): RedirectResponse
    {
        Transaction::create($request->validated());

        return redirect()->back()->with('success', 'Transaksi berhasil dicatat.');
    }

    public function update(UpdateTransactionRequest $request, Transaction $transaction): RedirectResponse
    {
        $transaction->update($request->validated());

        return redirect()->back()->with('success', 'Transaksi berhasil diperbarui.');
    }

    public function destroy(Transaction $transaction): RedirectResponse
    {
        $transaction->delete();

        return redirect()->back()->with('success', 'Transaksi berhasil dihapus.');
    }
}
