<?php

namespace App\Services;

use App\Enums\CategoryType;
use App\Enums\TransactionAction;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class LedgerService
{
    public function getAccountBalance(Account $account): string
    {
        return $this->getAccountBalanceAsOf($account, now());
    }

    public function getAccountBalanceAsOf(Account $account, CarbonInterface $date): string
    {
        $total = '0.00';
        $transactions = Transaction::query()
            ->with('category')
            ->where('transaction_date', '<=', $date)
            ->where(fn ($query) => $query->where('account_id', $account->id)->orWhere('transfer_account_id', $account->id))
            ->get();

        foreach ($transactions as $transaction) {
            $total = bcadd($total, $this->getAccountEffect($transaction, $account), 2);
        }

        return $total;
    }

    public function getExpenseActual(Category $category, CarbonInterface $monthStart, CarbonInterface $monthEnd): string
    {
        $sum = Transaction::query()
            ->where('category_id', $category->id)
            ->whereBetween('transaction_date', [$monthStart, $monthEnd])
            ->sum('amount');

        return number_format((float) $sum, 2, '.', '');
    }

    /**
     * @param  Collection<int, Category>  $categories
     * @return Collection<int, string>
     */
    public function getExpenseActualsByCategory(Collection $categories, CarbonInterface $monthStart, CarbonInterface $monthEnd): Collection
    {
        return Transaction::query()
            ->whereIn('category_id', $categories->pluck('id'))
            ->whereBetween('transaction_date', [$monthStart, $monthEnd])
            ->selectRaw('category_id, SUM(amount) as actual_amount')
            ->groupBy('category_id')
            ->pluck('actual_amount', 'category_id')
            ->map(fn (mixed $amount): string => number_format((float) $amount, 2, '.', ''));
    }

    public function getTotalAccountBalance(): string
    {
        $total = '0.00';
        foreach (Account::active()->get() as $account) {
            $total = bcadd($total, $this->getAccountBalance($account), 2);
        }

        return $total;
    }

    public function getTotalDebt(): string
    {
        return $this->getOpenBalanceForCategory(CategoryType::Debt, TransactionAction::ReceiveLoan, TransactionAction::RepayDebt);
    }

    public function getTotalReceivable(): string
    {
        return $this->getOpenBalanceForCategory(CategoryType::Receivable, TransactionAction::GiveLoan, TransactionAction::ReceiveRepayment);
    }

    public function getTotalIncome(CarbonInterface $start, CarbonInterface $end): string
    {
        return $this->getCategoryAmount(CategoryType::Income, $start, $end);
    }

    public function getTotalExpenses(CarbonInterface $start, CarbonInterface $end): string
    {
        return $this->getCategoryAmount(CategoryType::Expense, $start, $end);
    }

    private function getAccountEffect(Transaction $transaction, Account $account): string
    {
        if ($transaction->category->type === CategoryType::Transfer) {
            return $transaction->account_id === $account->id ? bcmul($transaction->amount, '-1', 2) : $transaction->amount;
        }

        $addsToAccount = in_array($transaction->category->type, [CategoryType::Income, CategoryType::OpeningBalance], true)
            || $transaction->action === TransactionAction::ReceiveLoan
            || $transaction->action === TransactionAction::ReceiveRepayment;

        return $addsToAccount ? $transaction->amount : bcmul($transaction->amount, '-1', 2);
    }

    private function getOpenBalanceForCategory(CategoryType $type, TransactionAction $increaseAction, TransactionAction $decreaseAction): string
    {
        $increase = Transaction::query()->whereHas('category', fn ($query) => $query->where('type', $type->value))->where('action', $increaseAction->value)->sum('amount');
        $decrease = Transaction::query()->whereHas('category', fn ($query) => $query->where('type', $type->value))->where('action', $decreaseAction->value)->sum('amount');

        return bcsub((string) $increase, (string) $decrease, 2);
    }

    private function getCategoryAmount(CategoryType $type, CarbonInterface $start, CarbonInterface $end): string
    {
        $sum = Transaction::query()->whereHas('category', fn ($query) => $query->where('type', $type->value))->whereBetween('transaction_date', [$start, $end])->sum('amount');

        return number_format((float) $sum, 2, '.', '');
    }
}
