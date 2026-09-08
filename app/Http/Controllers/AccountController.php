<?php

namespace App\Http\Controllers;

use App\Enums\CategoryType;
use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;
use App\Models\Account;
use App\Models\AccountType;
use App\Models\Category;
use App\Models\Transaction;
use App\Services\LedgerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function __construct(private LedgerService $ledger) {}

    public function index(): Response
    {
        $accounts = Account::with('accountType')->orderBy('name')->get()->each(function (Account $account): void {
            $account->balance = $this->ledger->getAccountBalance($account);
        });

        return Inertia::render('accounts/index', ['accounts' => $accounts]);
    }

    public function store(StoreAccountRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $validated = $request->validated();
            $accountType = $this->resolveAccountType($validated['account_type'] ?? null);
            $account = Account::create([...$validated, 'account_type_id' => $accountType?->id]);

            if ($request->filled('opening_balance') && (float) $validated['opening_balance'] > 0) {
                $category = Category::firstOrCreate(['type' => CategoryType::OpeningBalance, 'name' => 'Saldo Awal'], ['is_active' => true]);
                Transaction::create(['transaction_date' => now(), 'amount' => $validated['opening_balance'], 'description' => 'Saldo Awal', 'category_id' => $category->id, 'account_id' => $account->id]);
            }
        });

        return redirect()->route('accounts.index')->with('success', 'Akun berhasil dibuat.');
    }

    public function update(UpdateAccountRequest $request, Account $account): RedirectResponse
    {
        $validated = $request->validated();
        $account->update([...$validated, 'account_type_id' => $this->resolveAccountType($validated['account_type'] ?? null)?->id]);

        return redirect()->route('accounts.index')->with('success', 'Akun berhasil diperbarui.');
    }

    public function destroy(Account $account): RedirectResponse
    {
        if ($account->transactions()->exists() || $account->transferTransactions()->exists()) {
            return redirect()->route('accounts.index')->with('error', 'Akun tidak dapat dihapus karena memiliki transaksi. Nonaktifkan akun tersebut.');
        }
        $account->delete();

        return redirect()->route('accounts.index')->with('success', 'Akun berhasil dihapus.');
    }

    private function resolveAccountType(?string $name): ?AccountType
    {
        return blank($name) ? null : AccountType::firstOrCreate(['name' => $name]);
    }
}
