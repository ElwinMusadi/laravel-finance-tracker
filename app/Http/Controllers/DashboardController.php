<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Budget;
use App\Models\Transaction;
use App\Services\LedgerService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private LedgerService $ledger) {}

    public function index(Request $request): Response
    {
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();

        // Total Assets
        $assetAccounts = Account::ofType('asset')->get();
        $totalAssets = $assetAccounts->reduce(function ($carry, $account) {
            return bcadd((string) $carry, $this->ledger->getAccountBalance($account), 2);
        }, '0.00');

        // Total Liabilities
        $liabilityAccounts = Account::ofType('liability')->get();
        $totalLiabilities = $liabilityAccounts->reduce(function ($carry, $account) {
            return bcadd((string) $carry, $this->ledger->getAccountBalance($account), 2);
        }, '0.00');

        // Net Worth
        $netWorth = bcsub((string) $totalAssets, (string) $totalLiabilities, 2);

        // Monthly Income
        $monthlyIncome = $this->ledger->getTotalIncome($startOfMonth, $endOfMonth);

        // Monthly Expense
        $monthlyExpense = $this->ledger->getTotalExpenses($startOfMonth, $endOfMonth);

        // Total Budget
        $totalBudget = Budget::whereBetween('period_month', [$startOfMonth, $endOfMonth])->sum('amount');

        $budgetUsedPercentage = $totalBudget > 0
            ? min((floatval($monthlyExpense) / floatval($totalBudget)) * 100, 100)
            : 0;

        // Recent Transactions
        $recentTransactions = Transaction::with(['sourceAccount', 'destinationAccount'])
            ->latest('transaction_date')
            ->latest('id')
            ->take(5)
            ->get();

        return Inertia::render('dashboard', [
            'metrics' => [
                'totalAssets' => $totalAssets,
                'totalLiabilities' => $totalLiabilities,
                'netWorth' => $netWorth,
                'monthlyIncome' => $monthlyIncome,
                'monthlyExpense' => $monthlyExpense,
                'totalBudget' => number_format((float) $totalBudget, 2, '.', ''),
                'budgetUsedPercentage' => round($budgetUsedPercentage, 1),
            ],
            'recentTransactions' => $recentTransactions,
            'currentMonth' => $now->format('F Y'),
        ]);
    }
}
