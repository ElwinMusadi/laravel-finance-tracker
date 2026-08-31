<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Support\Carbon;

/**
 * Service for calculating account balances from the ledger.
 *
 * Balance = SUM(incoming) - SUM(outgoing)
 *
 * Aggregations are separated to avoid MySQL BIGINT UNSIGNED subtraction errors.
 * The subtraction is performed in PHP where negative results are safe.
 */
class LedgerService
{
    /**
     * Calculate the current balance for a given account.
     *
     * @return string Balance as a decimal string (can be negative)
     */
    public function getAccountBalance(Account $account): string
    {
        $incoming = Transaction::where('destination_account_id', $account->id)
            ->sum('amount');

        $outgoing = Transaction::where('source_account_id', $account->id)
            ->sum('amount');

        return bcsub((string) $incoming, (string) $outgoing, 2);
    }

    /**
     * Calculate the balance for a given account up to a specific date.
     *
     * @return string Balance as a decimal string (can be negative)
     */
    public function getAccountBalanceAsOf(Account $account, \Carbon\CarbonInterface $date): string
    {
        $incoming = Transaction::where('destination_account_id', $account->id)
            ->where('transaction_date', '<=', $date)
            ->sum('amount');

        $outgoing = Transaction::where('source_account_id', $account->id)
            ->where('transaction_date', '<=', $date)
            ->sum('amount');

        return bcsub((string) $incoming, (string) $outgoing, 2);
    }

    /**
     * Calculate the total spent (actual) for an expense account in a given month.
     *
     * Budget actual = SUM(amount) where destination = expense account within the month.
     *
     * @param  \Carbon\CarbonInterface  $monthStart  First day of the month in UTC
     * @param  \Carbon\CarbonInterface  $monthEnd  Last moment of the month in UTC
     * @return string Total spent as a decimal string
     */
    public function getExpenseActual(Account $account, \Carbon\CarbonInterface $monthStart, \Carbon\CarbonInterface $monthEnd): string
    {
        $sum = Transaction::where('destination_account_id', $account->id)
            ->whereBetween('transaction_date', [$monthStart, $monthEnd])
            ->sum('amount');

        return number_format((float) $sum, 2, '.', '');
    }

    /**
     * Calculate balances for all accounts of a given type.
     *
     * @return array<int, array{account: Account, balance: string}>
     */
    public function getBalancesByType(string $type): array
    {
        $accounts = Account::ofType($type)->active()->get();

        return $accounts->map(fn (Account $account): array => [
            'account' => $account,
            'balance' => $this->getAccountBalance($account),
        ])->all();
    }

    /**
     * Calculate total balance across all asset accounts.
     *
     * @return string Total balance as a decimal string
     */
    public function getTotalAssetBalance(): string
    {
        $accounts = Account::ofType('asset')->active()->get();
        $total = '0.00';

        foreach ($accounts as $account) {
            $total = bcadd($total, $this->getAccountBalance($account), 2);
        }

        return $total;
    }

    /**
     * Calculate total income for a given UTC date range.
     *
     * Income = transactions where source is revenue and destination is asset.
     *
     * @return string Total income as a decimal string
     */
    public function getTotalIncome(\Carbon\CarbonInterface $start, \Carbon\CarbonInterface $end): string
    {
        $sum = Transaction::whereHas('sourceAccount', fn ($q) => $q->where('type', 'revenue'))
            ->whereBetween('transaction_date', [$start, $end])
            ->sum('amount');

        return number_format((float) $sum, 2, '.', '');
    }

    /**
     * Calculate total expenses for a given UTC date range.
     *
     * Expense = transactions where destination is expense account.
     *
     * @return string Total expenses as a decimal string
     */
    public function getTotalExpenses(\Carbon\CarbonInterface $start, \Carbon\CarbonInterface $end): string
    {
        $sum = Transaction::whereHas('destinationAccount', fn ($q) => $q->where('type', 'expense'))
            ->whereBetween('transaction_date', [$start, $end])
            ->sum('amount');

        return number_format((float) $sum, 2, '.', '');
    }
}
