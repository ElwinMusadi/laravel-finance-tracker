<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $accounts = DB::table('accounts')->orderBy('id')->get();
        $transactions = DB::table('transactions')->orderBy('id')->get();
        $budgets = DB::table('budgets')->orderBy('id')->get();

        $this->assertLegacyDataIsUnambiguous($accounts, $transactions, $budgets);

        Schema::rename('budgets', 'legacy_budgets');
        Schema::rename('transactions', 'legacy_transactions');
        Schema::rename('accounts', 'legacy_accounts');

        $this->createNewTables();
        $typeIds = $this->createAccountTypes($accounts);
        $categoryIds = $this->createCategories($accounts, $budgets);
        $this->copyAccounts($accounts, $typeIds);
        $this->copyTransactions($accounts, $transactions, $categoryIds);

        Schema::dropIfExists('legacy_budgets');
        Schema::dropIfExists('legacy_transactions');
        Schema::dropIfExists('legacy_accounts');
    }

    public function down(): void
    {
        throw new RuntimeException('Migrasi domain keuangan ini tidak dapat dibatalkan tanpa cadangan database.');
    }

    private function assertLegacyDataIsUnambiguous(Collection $accounts, Collection $transactions, Collection $budgets): void
    {
        if ($budgets->groupBy('account_id')->contains(fn (Collection $accountBudgets): bool => $accountBudgets->count() > 1)) {
            throw new RuntimeException('Riwayat budget bulanan lama tidak dapat dipetakan ke satu batas budget kategori.');
        }

        $accountsById = $accounts->keyBy('id');

        foreach ($transactions as $transaction) {
            $source = $accountsById->get($transaction->source_account_id);
            $destination = $accountsById->get($transaction->destination_account_id);
            $knownFlow = $source !== null && $destination !== null && (
                ($source->type === 'revenue' && $destination->type === 'asset')
                || ($source->type === 'asset' && $destination->type === 'expense')
                || ($source->type === 'equity' && $destination->type === 'asset')
                || ($source->type === 'liability' && $destination->type === 'asset')
                || ($source->type === 'asset' && $destination->type === 'liability')
                || ($source->type === 'asset' && $destination->type === 'asset')
            );

            if (! $knownFlow || ($source->type === 'asset' && $destination->type === 'asset' && $source->contact_id !== null && $destination->contact_id !== null)) {
                throw new RuntimeException("Transaksi lama {$transaction->id} ambigu dan tidak dapat dimigrasikan secara aman.");
            }
        }
    }

    private function createNewTables(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('account_type_id')->nullable()->constrained()->nullOnDelete();
            $table->string('icon')->nullable();
            $table->string('color')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->dateTime('transaction_date');
            $table->decimal('amount', 15, 2)->unsigned();
            $table->string('description');
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->foreignId('account_id')->constrained()->restrictOnDelete();
            $table->foreignId('transfer_account_id')->nullable()->constrained('accounts')->restrictOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('action')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['category_id', 'transaction_date']);
        });
    }

    /** @return array<string, int> */
    private function createAccountTypes(Collection $accounts): array
    {
        $ids = [];
        foreach ($accounts->where('type', 'asset')->pluck('type')->unique() as $type) {
            $ids[$type] = DB::table('account_types')->insertGetId(['name' => ucfirst((string) $type), 'created_at' => now(), 'updated_at' => now()]);
        }

        return $ids;
    }

    /** @return array<string, int> */
    private function createCategories(Collection $accounts, Collection $budgets): array
    {
        $ids = [];
        foreach ($accounts->whereIn('type', ['revenue', 'expense']) as $account) {
            $budget = $budgets->firstWhere('account_id', $account->id);
            $ids["{$account->type}:{$account->id}"] = DB::table('categories')->insertGetId([
                'name' => $account->name,
                'type' => $account->type === 'revenue' ? 'income' : 'expense',
                'budget_limit' => $budget?->amount,
                'icon' => $account->icon,
                'color' => $account->color,
                'is_active' => $account->is_active,
                'created_at' => $account->created_at,
                'updated_at' => $account->updated_at,
            ]);
        }
        foreach (['debt' => 'Utang', 'receivable' => 'Piutang', 'transfer' => 'Transfer', 'opening_balance' => 'Saldo Awal'] as $type => $name) {
            $ids[$type] = DB::table('categories')->insertGetId(['name' => $name, 'type' => $type, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        }

        return $ids;
    }

    /** @param array<string, int> $typeIds */
    private function copyAccounts(Collection $accounts, array $typeIds): void
    {
        foreach ($accounts->where('type', 'asset') as $account) {
            DB::table('accounts')->insert([
                'id' => $account->id,
                'name' => $account->name,
                'account_type_id' => $typeIds[$account->type],
                'icon' => $account->icon,
                'color' => $account->color,
                'is_active' => $account->is_active,
                'created_at' => $account->created_at,
                'updated_at' => $account->updated_at,
            ]);
        }
    }

    /** @param array<string, int> $categoryIds */
    private function copyTransactions(Collection $accounts, Collection $transactions, array $categoryIds): void
    {
        $accountsById = $accounts->keyBy('id');
        foreach ($transactions as $transaction) {
            $source = $accountsById->get($transaction->source_account_id);
            $destination = $accountsById->get($transaction->destination_account_id);
            [$categoryId, $accountId, $transferAccountId, $contactId, $action] = match (true) {
                $source->type === 'revenue' => [$categoryIds["revenue:{$source->id}"], $destination->id, null, null, null],
                $destination->type === 'expense' => [$categoryIds["expense:{$destination->id}"], $source->id, null, null, null],
                $source->type === 'equity' => [$categoryIds['opening_balance'], $destination->id, null, null, null],
                $source->type === 'liability' => [$categoryIds['debt'], $destination->id, null, $source->contact_id, 'receive_loan'],
                $destination->type === 'liability' => [$categoryIds['debt'], $source->id, null, $destination->contact_id, 'repay_debt'],
                $source->contact_id !== null => [$categoryIds['receivable'], $destination->id, null, $source->contact_id, 'receive_repayment'],
                $destination->contact_id !== null => [$categoryIds['receivable'], $source->id, null, $destination->contact_id, 'give_loan'],
                default => [$categoryIds['transfer'], $source->id, $destination->id, null, null],
            };
            DB::table('transactions')->insert([
                'id' => $transaction->id, 'transaction_date' => $transaction->transaction_date, 'amount' => $transaction->amount, 'description' => $transaction->description,
                'category_id' => $categoryId, 'account_id' => $accountId, 'transfer_account_id' => $transferAccountId, 'contact_id' => $contactId, 'action' => $action,
                'notes' => $transaction->notes, 'created_at' => $transaction->created_at, 'updated_at' => $transaction->updated_at,
            ]);
        }
    }
};
