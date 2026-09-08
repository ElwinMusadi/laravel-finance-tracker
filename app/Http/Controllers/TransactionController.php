<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Transaction::with(['sourceAccount', 'destinationAccount'])->latest('transaction_date')->latest('id');

        // Optional filtering by month
        if ($request->filled('month')) {
            // Assume format YYYY-MM
            $month = Carbon::createFromFormat('Y-m', $request->input('month'));
            $start = $month->copy()->startOfMonth();
            $end = $month->copy()->endOfMonth();
            $query->whereBetween('transaction_date', [$start, $end]);
        }

        // Optional filtering by account (either source or destination)
        if ($request->filled('account_id')) {
            $accountId = $request->input('account_id');
            $query->where(function ($q) use ($accountId) {
                $q->where('source_account_id', $accountId)
                    ->orWhere('destination_account_id', $accountId);
            });
        }

        $transactions = $query->paginate(50)->withQueryString();

        $accounts = Account::active()->orderBy('name')->get();

        return Inertia::render('transactions/index', [
            'transactions' => $transactions,
            'accounts' => $accounts,
            'filters' => $request->only(['month', 'account_id']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTransactionRequest $request): RedirectResponse
    {
        Transaction::create($request->validated());

        return redirect()->back()->with('success', 'Transaksi berhasil dicatat.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTransactionRequest $request, Transaction $transaction): RedirectResponse
    {
        $transaction->update($request->validated());

        return redirect()->back()->with('success', 'Transaksi berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Transaction $transaction): RedirectResponse
    {
        $transaction->delete();

        return redirect()->back()->with('success', 'Transaksi berhasil dihapus.');
    }
}
