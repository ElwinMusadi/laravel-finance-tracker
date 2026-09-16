<?php

namespace App\Http\Controllers;

use App\Enums\CategoryType;
use App\Http\Requests\UpdateBudgetRequest;
use App\Models\Category;
use App\Services\LedgerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BudgetController extends Controller
{
    public function __construct(private LedgerService $ledger) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
            'sort' => [
                'nullable',
                Rule::in(['name_asc', 'realization_desc', 'realization_asc']),
            ],
        ]);
        $monthInput = $filters['month'] ?? now()->format('Y-m');
        $sort = $filters['sort'] ?? 'name_asc';
        $month = Carbon::createFromFormat('Y-m', $monthInput);
        $start = $month->copy()->startOfMonth();
        $end = $month->copy()->endOfMonth();
        $categories = Category::query()
            ->where('type', CategoryType::Expense)
            ->orderBy('name')
            ->get();
        $actualAmounts = $this->ledger->getExpenseActualsByCategory(
            $categories,
            $start,
            $end,
        );
        $budgetData = $categories
            ->map(function (Category $category) use ($actualAmounts): array {
                $budgetAmount = $category->budget_limit ?? '0.00';
                $actualAmount = $actualAmounts->get($category->id, '0.00');
                $realizationPercentage = (float) $budgetAmount > 0
                    ? round(((float) $actualAmount / (float) $budgetAmount) * 100, 2)
                    : null;

                return [
                    'category' => $category,
                    'budget_amount' => $budgetAmount,
                    'actual_amount' => $actualAmount,
                    'realization_percentage' => $realizationPercentage,
                ];
            })
            ->sort(function (array $left, array $right) use ($sort): int {
                $leftPercentage = $left['realization_percentage'];
                $rightPercentage = $right['realization_percentage'];

                if ($sort !== 'name_asc') {
                    if ($leftPercentage === null || $rightPercentage === null) {
                        if ($leftPercentage === null && $rightPercentage !== null) {
                            return 1;
                        }

                        if ($leftPercentage !== null && $rightPercentage === null) {
                            return -1;
                        }
                    } elseif ($leftPercentage !== $rightPercentage) {
                        return $sort === 'realization_desc'
                            ? $rightPercentage <=> $leftPercentage
                            : $leftPercentage <=> $rightPercentage;
                    }
                }

                return [$left['category']->name, $left['category']->id]
                    <=> [$right['category']->name, $right['category']->id];
            })
            ->values();

        return Inertia::render('budgets/index', [
            'budgetData' => $budgetData,
            'currentMonth' => $monthInput,
            'filters' => [
                'month' => $monthInput,
                'sort' => $sort,
            ],
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
        $category = Category::query()
            ->where('type', CategoryType::Expense)
            ->findOrFail($category->id);
        $category->update(['budget_limit' => null]);

        return redirect()->back()->with('success', 'Budget berhasil dihapus.');
    }
}
