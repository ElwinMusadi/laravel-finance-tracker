import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { destroy } from '@/actions/App/Http/Controllers/BudgetController';
import { index as budgetsIndex } from '@/routes/budgets';
import { BudgetFormModal } from '@/components/budget-form-modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    IconPencil,
    IconTrash,
    IconChartPie,
    IconAlertCircle,
    IconCheck,
    IconTrendingUp,
    IconTrendingDown,
    IconCalendar,
} from '@tabler/icons-react';

type Category = { id: number; name: string; budget_limit: string | null };
type BudgetSort = 'name_asc' | 'realization_desc' | 'realization_asc';

type Item = {
    category: Category;
    budget_amount: string;
    actual_amount: string;
    realization_percentage: number | null;
};

type BudgetFilters = {
    month: string;
    sort: BudgetSort;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Budget', href: '/budgets' }];

export default function BudgetsIndex({
    budgetData = [],
    currentMonth,
    filters,
}: {
    budgetData: Item[];
    currentMonth: string;
    filters: BudgetFilters;
}) {
    const [month, setMonth] = useState(filters.month ?? currentMonth);
    const [sort, setSort] = useState<BudgetSort>(filters.sort);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(
        null,
    );
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setMonth(filters.month);
        setSort(filters.sort);
    }, [filters]);

    const applyFilters = (nextMonth: string, nextSort: BudgetSort) => {
        router.get(
            budgetsIndex.url({ query: { month: nextMonth, sort: nextSort } }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const formatCurrency = (val: string | number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Number(val));
    };

    const summary = useMemo(() => {
        let totalBudget = 0;
        let totalActual = 0;

        budgetData.forEach((item) => {
            const actual = Number(item.actual_amount || 0);
            totalActual += actual;

            if (item.category.budget_limit) {
                totalBudget += Number(item.budget_amount || 0);
            }
        });

        const remaining = totalBudget - totalActual;
        const usedPercentage =
            totalBudget > 0
                ? Math.min(Math.round((totalActual / totalBudget) * 100), 100)
                : 0;

        return {
            totalBudget,
            totalActual,
            remaining,
            usedPercentage,
        };
    }, [budgetData]);

    const handleDeleteBudget = () => {
        if (!deletingCategory) return;
        setIsDeleting(true);
        router.delete(destroy.url(deletingCategory.id), {
            preserveState: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeletingCategory(null);
            },
        });
    };

    return (
        <>
            <Head title="Anggaran & Budget" />
            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Title & Month Selector */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Kontrol Anggaran
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Pantau dan kendalikan pengeluaran bulanan agar tidak
                            melebihi batas yang direncanakan.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                        <div className="bg-card flex items-center gap-2 rounded-lg border px-3 py-1.5 shadow-2xs">
                            <IconCalendar className="text-muted-foreground size-4" />
                            <Input
                                className="h-7 w-36 border-0 p-0 text-sm focus-visible:ring-0"
                                type="month"
                                value={month}
                                onChange={(event) => {
                                    setMonth(event.target.value);
                                    applyFilters(event.target.value, sort);
                                }}
                            />
                        </div>
                        <Select
                            value={sort}
                            onValueChange={(value) => {
                                const nextSort = value as BudgetSort;
                                setSort(nextSort);
                                applyFilters(month, nextSort);
                            }}
                        >
                            <SelectTrigger
                                className="w-48"
                                aria-label="Urutkan budget"
                            >
                                <SelectValue placeholder="Urutkan budget" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="name_asc">
                                        Nama kategori
                                    </SelectItem>
                                    <SelectItem value="realization_desc">
                                        Realisasi tertinggi
                                    </SelectItem>
                                    <SelectItem value="realization_asc">
                                        Realisasi terendah
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Overview Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                Total Anggaran Dialokasikan
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold tabular-nums">
                                {formatCurrency(summary.totalBudget)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground pt-0 text-xs">
                            Jumlah batas belanja pada seluruh kategori
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                Total Realisasi Pengeluaran
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold text-rose-600 tabular-nums dark:text-rose-400">
                                {formatCurrency(summary.totalActual)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground pt-0 text-xs">
                            Pengeluaran yang telah terjadi pada periode ini
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                    Sisa Anggaran
                                </CardDescription>
                                <Badge
                                    variant="outline"
                                    className={
                                        summary.remaining >= 0
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                            : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    }
                                >
                                    {summary.remaining >= 0 ? (
                                        <IconTrendingUp className="mr-1 size-3" />
                                    ) : (
                                        <IconTrendingDown className="mr-1 size-3" />
                                    )}
                                    {summary.remaining >= 0 ? 'Sisa' : 'Over'}
                                </Badge>
                            </div>
                            <CardTitle
                                className={`text-2xl font-bold tabular-nums ${
                                    summary.remaining >= 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-rose-600 dark:text-rose-400'
                                }`}
                            >
                                {formatCurrency(Math.abs(summary.remaining))}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground flex flex-col gap-1.5 pt-0 text-xs">
                            <div className="flex justify-between">
                                <span>Pemakaian Budget Global:</span>
                                <span className="text-foreground font-semibold">
                                    {summary.usedPercentage}%
                                </span>
                            </div>
                            <Progress
                                value={summary.usedPercentage}
                                className={`h-1.5 ${
                                    summary.usedPercentage >= 90
                                        ? '[&>div]:bg-rose-500'
                                        : '[&>div]:bg-emerald-500'
                                }`}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Categories Budget Grid */}
                {budgetData.length === 0 ? (
                    <Card className="border-border/60 shadow-xs">
                        <CardContent className="text-muted-foreground flex flex-col items-center justify-center p-12 text-center text-sm">
                            <IconChartPie className="text-muted-foreground/50 mb-3 size-10" />
                            <p className="text-foreground text-base font-semibold">
                                Belum ada kategori pengeluaran
                            </p>
                            <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                                Buat kategori bertipe Pengeluaran di menu
                                Kategori terlebih dahulu untuk dapat menetapkan
                                anggaran belanja.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {budgetData.map((item) => {
                            const hasLimit = Boolean(
                                item.category.budget_limit,
                            );
                            const budget = Number(item.budget_amount || 0);
                            const actual = Number(item.actual_amount || 0);
                            const percent = item.realization_percentage ?? 0;
                            const isOver = percent > 100;
                            const isWarning = percent >= 75 && !isOver;

                            return (
                                <Card
                                    key={item.category.id}
                                    className={`border-border/60 shadow-xs transition-shadow hover:shadow-sm ${
                                        isOver
                                            ? 'border-rose-500/40 bg-rose-500/2'
                                            : ''
                                    }`}
                                >
                                    <CardHeader className="pt-3.5 pb-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <CardTitle className="text-base font-semibold">
                                                    {item.category.name}
                                                </CardTitle>
                                                <CardDescription className="mt-0.5 text-xs">
                                                    {hasLimit
                                                        ? `Budget: ${formatCurrency(budget)}`
                                                        : 'Belum ada batas budget'}
                                                </CardDescription>
                                            </div>
                                            {hasLimit ? (
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        isOver
                                                            ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                            : isWarning
                                                              ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                    }
                                                >
                                                    {isOver ? (
                                                        <span className="flex items-center gap-1 font-semibold">
                                                            <IconAlertCircle className="size-3" />
                                                            Over{' '}
                                                            {Math.round(
                                                                percent,
                                                            )}
                                                            %
                                                        </span>
                                                    ) : isWarning ? (
                                                        <span>
                                                            Waspada{' '}
                                                            {Math.round(
                                                                percent,
                                                            )}
                                                            %
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1">
                                                            <IconCheck className="size-3" />
                                                            {Math.round(
                                                                percent,
                                                            )}
                                                            %
                                                        </span>
                                                    )}
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs font-normal"
                                                >
                                                    Bebas
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-0 pb-4">
                                        {/* Figures */}
                                        <div className="-mb-2 flex items-baseline justify-between">
                                            <div className="text-muted-foreground text-xs">
                                                Realisasi Pengeluaran:
                                            </div>
                                            <div className="text-foreground font-mono text-base font-bold">
                                                {formatCurrency(actual)}
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        {hasLimit ? (
                                            <div className="flex flex-col gap-1.5">
                                                <Progress
                                                    value={Math.min(
                                                        percent,
                                                        100,
                                                    )}
                                                    className={`h-2 ${
                                                        isOver
                                                            ? '[&>div]:bg-rose-500'
                                                            : isWarning
                                                              ? '[&>div]:bg-amber-500'
                                                              : '[&>div]:bg-emerald-500'
                                                    }`}
                                                />
                                                <div className="text-muted-foreground flex justify-between text-[11px]">
                                                    <span>
                                                        {Math.round(percent)}%
                                                        terpakai
                                                    </span>
                                                    <span
                                                        className={
                                                            isOver
                                                                ? 'font-bold text-rose-600 dark:text-rose-400'
                                                                : ''
                                                        }
                                                    >
                                                        {isOver
                                                            ? `Melebihi ${formatCurrency(actual - budget)}`
                                                            : `Tersisa ${formatCurrency(budget - actual)}`}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-muted/40 text-muted-foreground rounded-md p-2 text-center text-xs">
                                                Tetapkan batas budget untuk
                                                memantau penggunaan dana
                                                kategori ini.
                                            </div>
                                        )}
                                    </CardContent>

                                    {/* Action footer */}
                                    <div className="bg-muted/10 flex items-center justify-between border-t px-4 py-0.5">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2.5 text-xs"
                                            onClick={() =>
                                                setSelectedCategory(
                                                    item.category,
                                                )
                                            }
                                        >
                                            <IconPencil className="mr-1.5 size-3.5" />
                                            {hasLimit
                                                ? 'Edit Budget'
                                                : 'Atur Budget'}
                                        </Button>

                                        {hasLimit && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2.5 text-xs"
                                                onClick={() =>
                                                    setDeletingCategory(
                                                        item.category,
                                                    )
                                                }
                                            >
                                                <IconTrash className="mr-1.5 size-3.5" />
                                                Hapus
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Edit Budget Modal */}
                {selectedCategory && (
                    <BudgetFormModal
                        isOpen={true}
                        onClose={() => setSelectedCategory(null)}
                        category={selectedCategory}
                    />
                )}

                {/* Delete Budget Confirmation Dialog */}
                <ConfirmDialog
                    isOpen={deletingCategory !== null}
                    onClose={() => setDeletingCategory(null)}
                    onConfirm={handleDeleteBudget}
                    title="Hapus Batas Anggaran"
                    description={`Apakah Anda yakin ingin menghapus batas anggaran untuk kategori "${deletingCategory?.name}"? Pengeluaran pada kategori ini tidak lagi memiliki batas nominal.`}
                    confirmText="Hapus Batas"
                    isLoading={isDeleting}
                />
            </div>
        </>
    );
}

BudgetsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
