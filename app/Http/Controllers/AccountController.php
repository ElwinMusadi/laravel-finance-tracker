<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;
use App\Models\Account;
use App\Models\Contact;
use App\Models\Transaction;
use App\Services\LedgerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function __construct(private LedgerService $ledger) {}

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $accounts = Account::with('contact')->orderBy('type')->orderBy('name')->get();

        // Calculate balances dynamically for all accounts
        $accountsWithBalances = $accounts->map(function (Account $account) {
            $account->balance = $this->ledger->getAccountBalance($account);

            return $account;
        });

        $contacts = Contact::active()->orderBy('name')->get();

        return Inertia::render('accounts/index', [
            'accounts' => $accountsWithBalances,
            'contacts' => $contacts,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAccountRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $account = Account::create($request->safe()->except('opening_balance'));

            if ($account->type === 'asset' && $request->filled('opening_balance') && $request->input('opening_balance') > 0) {
                // Find or create the default equity account for opening balances
                $equity = Account::firstOrCreate(
                    ['type' => 'equity', 'name' => 'Opening Balance'],
                    ['is_active' => true]
                );

                Transaction::create([
                    'transaction_date' => now(), // UTC
                    'amount' => $request->input('opening_balance'),
                    'description' => 'Opening Balance',
                    'source_account_id' => $equity->id,
                    'destination_account_id' => $account->id,
                ]);
            }
        });

        return redirect()->route('accounts.index')->with('success', 'Akun berhasil dibuat.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAccountRequest $request, Account $account): RedirectResponse
    {
        $account->update($request->validated());

        return redirect()->route('accounts.index')->with('success', 'Akun berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Account $account): RedirectResponse
    {
        if ($account->incomingTransactions()->exists() || $account->outgoingTransactions()->exists()) {
            return redirect()->route('accounts.index')
                ->with('error', 'Akun tidak dapat dihapus karena memiliki transaksi. Nonaktifkan akun tersebut.');
        }

        $account->delete();

        return redirect()->route('accounts.index')->with('success', 'Akun berhasil dihapus.');
    }
}
