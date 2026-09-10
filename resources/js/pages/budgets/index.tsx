import { Head, router } from "@inertiajs/react";
import { useState, useMemo } from "react";
import { destroy } from "@/actions/App/Http/Controllers/BudgetController";
import { BudgetFormModal } from "@/components/budget-form-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/layouts/app-layout";
import type { BreadcrumbItem } from "@/types";
import {
    IconPencil,
    IconTrash,
    IconChartPie,
    IconAlertCircle,
    IconCheck,
    IconTrendingUp,
    IconTrendingDown,
    IconCalendar,
} from "@tabler/icons-react";

type Category = { id: number; name: string; budget_limit: string | null };
type Item = {
    category: Category;
    budget_amount: string;
    actual_amount: string;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: "Budget", href: "/budgets" }];

export default function BudgetsIndex({
    budgetData = [],
    currentMonth,
}: {
    budgetData: Item[];
    currentMonth: string;
}) {
    const [month, setMonth] = useState(currentMonth);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(
        null,
    );
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);

    const formatCurrency = (val: string | number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
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
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Header Title & Month Selector */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Kontrol Anggaran
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Pantau dan kendalikan pengeluaran bulanan agar tidak
                            melebihi batas yang direncanakan.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-card shadow-2xs">
                            <IconCalendar className="size-4 text-muted-foreground" />
                            <Input
                                className="w-36 h-7 border-0 p-0 text-sm focus-visible:ring-0"
                                type="month"
                                value={month}
                                onChange={(event) => {
                                    setMonth(event.target.value);
                                    router.get(
                                        "/budgets",
                                        { month: event.target.value },
                                        { preserveState: true },
                                    );
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Overview Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Total Anggaran Dialokasikan
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold tabular-nums">
                                {formatCurrency(summary.totalBudget)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-xs text-muted-foreground">
                            Jumlah batas belanja pada seluruh kategori
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Total Realisasi Pengeluaran
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
                                {formatCurrency(summary.totalActual)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-xs text-muted-foreground">
                            Pengeluaran yang telah terjadi pada periode ini
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Sisa Anggaran
                                </CardDescription>
                                <Badge
                                    variant="outline"
                                    className={
                                        summary.remaining >= 0
                                            ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                            : "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10"
                                    }
                                >
                                    {summary.remaining >= 0 ? (
                                        <IconTrendingUp className="mr-1 size-3" />
                                    ) : (
                                        <IconTrendingDown className="mr-1 size-3" />
                                    )}
                                    {summary.remaining >= 0 ? "Sisa" : "Over"}
                                </Badge>
                            </div>
                            <CardTitle
                                className={`text-2xl font-bold tabular-nums ${
                                    summary.remaining >= 0
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-rose-600 dark:text-rose-400"
                                }`}
                            >
                                {formatCurrency(Math.abs(summary.remaining))}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 flex flex-col gap-1.5 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Pemakaian Budget Global:</span>
                                <span className="font-semibold text-foreground">
                                    {summary.usedPercentage}%
                                </span>
                            </div>
                            <Progress
                                value={summary.usedPercentage}
                                className={`h-1.5 ${
                                    summary.usedPercentage >= 90
                                        ? "[&>div]:bg-rose-500"
                                        : "[&>div]:bg-emerald-500"
                                }`}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Categories Budget Grid */}
                {budgetData.length === 0 ? (
                    <Card className="border-border/60 shadow-xs">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-sm text-muted-foreground">
                            <IconChartPie className="size-10 text-muted-foreground/50 mb-3" />
                            <p className="font-semibold text-foreground text-base">
                                Belum ada kategori pengeluaran
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                Buat kategori bertipe Pengeluaran di menu
                                Kategori terlebih dahulu untuk dapat menetapkan
                                anggaran belanja.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {budgetData.map((item) => {
                            const hasLimit = Boolean(
                                item.category.budget_limit,
                            );
                            const budget = Number(item.budget_amount || 0);
                            const actual = Number(item.actual_amount || 0);
                            const percent =
                                hasLimit && budget > 0
                                    ? Math.round((actual / budget) * 100)
                                    : 0;
                            const isOver = hasLimit && actual > budget;
                            const isWarning =
                                hasLimit && percent >= 75 && !isOver;

                            return (
                                <Card
                                    key={item.category.id}
                                    className={`border-border/60 shadow-xs transition-shadow hover:shadow-sm ${
                                        isOver
                                            ? "border-rose-500/40 bg-rose-500/[0.02]"
                                            : ""
                                    }`}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <CardTitle className="text-base font-semibold">
                                                    {item.category.name}
                                                </CardTitle>
                                                <CardDescription className="text-xs mt-0.5">
                                                    {hasLimit
                                                        ? `Batas: ${formatCurrency(budget)}`
                                                        : "Belum ada batas budget"}
                                                </CardDescription>
                                            </div>
                                            {hasLimit ? (
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        isOver
                                                            ? "border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10"
                                                            : isWarning
                                                              ? "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                                                              : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                                    }
                                                >
                                                    {isOver ? (
                                                        <span className="flex items-center gap-1 font-semibold">
                                                            <IconAlertCircle className="size-3" />
                                                            Over {percent}%
                                                        </span>
                                                    ) : isWarning ? (
                                                        <span>
                                                            Waspada {percent}%
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1">
                                                            <IconCheck className="size-3" />
                                                            {percent}%
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
                                        <div className="flex items-baseline justify-between mb-2">
                                            <div className="text-xs text-muted-foreground">
                                                Realisasi Pengeluaran:
                                            </div>
                                            <div className="text-base font-bold font-mono text-foreground">
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
                                                            ? "[&>div]:bg-rose-500"
                                                            : isWarning
                                                              ? "[&>div]:bg-amber-500"
                                                              : "[&>div]:bg-emerald-500"
                                                    }`}
                                                />
                                                <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
                                                    <span>
                                                        {percent}% terpakai
                                                    </span>
                                                    <span
                                                        className={
                                                            isOver
                                                                ? "font-bold text-rose-600 dark:text-rose-400"
                                                                : ""
                                                        }
                                                    >
                                                        {isOver
                                                            ? `Melebihi ${formatCurrency(actual - budget)}`
                                                            : `Tersisa ${formatCurrency(budget - actual)}`}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="rounded-md bg-muted/40 p-2 text-center text-xs text-muted-foreground">
                                                Tetapkan batas budget untuk
                                                memantau penggunaan dana
                                                kategori ini.
                                            </div>
                                        )}
                                    </CardContent>

                                    {/* Action footer */}
                                    <div className="border-t px-4 py-2.5 flex items-center justify-between bg-muted/10">
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
                                                ? "Ubah Budget"
                                                : "Atur Budget"}
                                        </Button>

                                        {hasLimit && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
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
