<?php

namespace App\Http\Controllers;

use App\Enums\CategoryType;
use App\Models\Category;
use App\Models\Transaction;
use App\Services\LedgerService;
use Carbon\CarbonInterface;
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

        $cashFlowTrend = $this->cashFlowByMonth($now, 6);
        $cashFlowCurrentMonth = $this->cashFlowByDay(
            $startOfMonth,
            $now->copy()->endOfDay(),
        );

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
            'cashFlowCurrentMonth' => $cashFlowCurrentMonth,
            'recentTransactions' => $recentTransactions,
            'currentMonth' => $now->translatedFormat('F Y'),
        ]);
    }

    /**
     * @return array<int, array{month: string, income: float, expense: float}>
     */
    private function cashFlowByMonth(CarbonInterface $now, int $months): array
    {
        $cashFlowTrend = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $monthDate = $now->copy()->subMonthsNoOverflow($i);
            $start = $monthDate->copy()->startOfMonth();
            $end = $monthDate->copy()->endOfMonth();
            $cashFlowTrend[] = [
                'month' => $monthDate->translatedFormat('M Y'),
                'income' => (float) $this->ledger->getTotalIncome($start, $end),
                'expense' => (float) $this->ledger->getTotalExpenses($start, $end),
            ];
        }

        return $cashFlowTrend;
    }

    /**
     * @return array<int, array{month: string, income: float, expense: float}>
     */
    private function cashFlowByDay(CarbonInterface $start, CarbonInterface $end): array
    {
        $dailyCashFlow = Transaction::query()
            ->join('categories', 'categories.id', '=', 'transactions.category_id')
            ->whereBetween('transactions.transaction_date', [$start, $end])
            ->whereIn('categories.type', [CategoryType::Income->value, CategoryType::Expense->value])
            ->selectRaw('DATE(transactions.transaction_date) as transaction_day')
            ->selectRaw('SUM(CASE WHEN categories.type = ? THEN transactions.amount ELSE 0 END) as income', [CategoryType::Income->value])
            ->selectRaw('SUM(CASE WHEN categories.type = ? THEN transactions.amount ELSE 0 END) as expense', [CategoryType::Expense->value])
            ->groupBy('transaction_day')
            ->get()
            ->keyBy('transaction_day');
        $cashFlowTrend = [];

        for ($day = $start->copy(); $day->lte($end); $day = $day->addDay()) {
            $dayKey = $day->toDateString();
            $cashFlowTrend[] = [
                'month' => $day->translatedFormat('j M'),
                'income' => (float) ($dailyCashFlow->get($dayKey)?->income ?? 0),
                'expense' => (float) ($dailyCashFlow->get($dayKey)?->expense ?? 0),
            ];
        }

        return $cashFlowTrend;
    }
}
