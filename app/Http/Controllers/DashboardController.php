<?php

namespace App\Http\Controllers;

use App\Enums\CategoryType;
use App\Models\Category;
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

        $totalAccounts = $this->ledger->getTotalAccountBalance();
        $totalReceivables = $this->ledger->getTotalReceivable();
        $totalDebts = $this->ledger->getTotalDebt();
        $netWorth = bcsub(bcadd($totalAccounts, $totalReceivables, 2), $totalDebts, 2);

        // Monthly Income
        $monthlyIncome = $this->ledger->getTotalIncome($startOfMonth, $endOfMonth);

        // Monthly Expense
        $monthlyExpense = $this->ledger->getTotalExpenses($startOfMonth, $endOfMonth);

        $totalBudget = Category::query()->where('type', CategoryType::Expense)->sum('budget_limit');

        $budgetUsedPercentage = $totalBudget > 0
          ? min((floatval($monthlyExpense) / floatval($totalBudget)) * 100, 100)
          : 0;

        // Recent Transactions
        $recentTransactions = Transaction::with(['account', 'transferAccount', 'category', 'contact'])
            ->latest('transaction_date')
            ->latest('id')
            ->take(5)
            ->get();

        // 6-Month Cash Flow Trend
        $cashFlowTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = $now->copy()->subMonths($i);
            $mStart = $monthDate->copy()->startOfMonth();
            $mEnd = $monthDate->copy()->endOfMonth();
            $cashFlowTrend[] = [
                'month' => $monthDate->translatedFormat('M Y'),
                'income' => (float) $this->ledger->getTotalIncome($mStart, $mEnd),
                'expense' => (float) $this->ledger->getTotalExpenses($mStart, $mEnd),
            ];
        }

        return Inertia::render('dashboard', [
            'metrics' => [
                'totalAccounts' => $totalAccounts,
                'totalReceivables' => $totalReceivables,
                'totalDebts' => $totalDebts,
                'totalAssets' => $totalAccounts,
                'totalLiabilities' => $totalDebts,
                'netWorth' => $netWorth,
                'monthlyIncome' => $monthlyIncome,
                'monthlyExpense' => $monthlyExpense,
                'totalBudget' => number_format((float) $totalBudget, 2, '.', ''),
                'budgetUsedPercentage' => round($budgetUsedPercentage, 1),
            ],
            'cashFlowTrend' => $cashFlowTrend,
            'recentTransactions' => $recentTransactions,
            'currentMonth' => $now->translatedFormat('F Y'),
        ]);
    }
}
