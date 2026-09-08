<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBudgetRequest;
use App\Http\Requests\UpdateBudgetRequest;
use App\Models\Account;
use App\Models\Budget;
use App\Services\LedgerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class BudgetController extends Controller
{
    public function __construct(private LedgerService $ledger) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        // Default to current month if not provided
        $monthInput = $request->input('month', now()->format('Y-m'));
        $month = Carbon::createFromFormat('Y-m', $monthInput);

        $start = $month->copy()->startOfMonth();
        $end = $month->copy()->endOfMonth();

        // Get all expense accounts
        $expenseAccounts = Account::ofType('expense')->orderBy('name')->get();

        // Get budgets for the selected month
        $budgets = Budget::with('account')
            ->whereBetween('period_month', [$start, $end])
            ->get()
            ->keyBy('account_id');

        // Compile budget data for the frontend
        $budgetData = $expenseAccounts->map(function ($account) use ($budgets, $start, $end) {
            $budget = $budgets->get($account->id);
            $actualStr = $this->ledger->getExpenseActual($account, $start, $end);

            return [
                'account' => $account,
                'budget' => $budget,
                'budget_amount' => $budget ? $budget->amount : '0.00',
                'actual_amount' => $actualStr,
            ];
        });

        return Inertia::render('budgets/index', [
            'budgetData' => $budgetData,
            'currentMonth' => $monthInput,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBudgetRequest $request): RedirectResponse
    {
        Budget::create($request->validated());

        return redirect()->back()->with('success', 'Budget berhasil ditetapkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBudgetRequest $request, Budget $budget): RedirectResponse
    {
        $budget->update($request->validated());

        return redirect()->back()->with('success', 'Budget berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Budget $budget): RedirectResponse
    {
        $budget->delete();

        return redirect()->back()->with('success', 'Budget berhasil dihapus.');
    }
}
