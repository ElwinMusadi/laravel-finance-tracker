<?php

namespace App\Http\Controllers;

use App\Enums\CategoryType;
use App\Http\Requests\UpdateBudgetRequest;
use App\Models\Category;
use App\Services\LedgerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class BudgetController extends Controller
{
    public function __construct(private LedgerService $ledger) {}

    public function index(Request $request): Response
    {
        $monthInput = $request->string('month', now()->format('Y-m'))->toString();
        $month = Carbon::createFromFormat('Y-m', $monthInput);
        $start = $month->copy()->startOfMonth();
        $end = $month->copy()->endOfMonth();
        $categories = Category::query()->where('type', CategoryType::Expense)->orderBy('name')->get();

        return Inertia::render('budgets/index', [
            'budgetData' => $categories->map(fn (Category $category): array => [
                'category' => $category,
                'budget_amount' => $category->budget_limit ?? '0.00',
                'actual_amount' => $this->ledger->getExpenseActual($category, $start, $end),
            ]),
            'currentMonth' => $monthInput,
        ]);
    }

    public function update(UpdateBudgetRequest $request, Category $category): RedirectResponse
    {
        $category = Category::query()->where('type', CategoryType::Expense)->findOrFail($category->id);
        $category->update(['budget_limit' => $request->validated('budget_limit')]);

        return redirect()->back()->with('success', 'Budget berhasil diperbarui.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $category->update(['budget_limit' => null]);

        return redirect()->back()->with('success', 'Budget berhasil dihapus.');
    }
}
