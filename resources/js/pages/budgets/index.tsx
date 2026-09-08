import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { BudgetFormModal } from '@/components/budget-form-modal';
import { destroy } from '@/actions/App/Http/Controllers/BudgetController';

interface Account {
    id: number;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
}

interface Budget {
    id: number;
    account_id: number;
    period_month: string;
    amount: string;
}

interface BudgetData {
    account: Account;
    budget: Budget | null;
    budget_amount: string;
    actual_amount: string;
}

interface Props {
    budgetData: BudgetData[];
    currentMonth: string; // YYYY-MM
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Budget',
        href: '/budgets',
    },
];

export default function BudgetsIndex({ budgetData, currentMonth }: Props) {
    const [month, setMonth] = useState(currentMonth);
    const [activeModalData, setActiveModalData] = useState<{ budget: Budget | null, account: Account } | null>(null);

    const handleMonthChange = (newMonth: string) => {
        setMonth(newMonth);
        router.get('/budgets', { month: newMonth }, { preserveState: true, preserveScroll: true });
    };

    const handleDelete = (budget: Budget) => {
        if (confirm('Apakah Anda yakin ingin menghapus budget ini?')) {
            router.delete(destroy.url(budget.id), { preserveScroll: true });
        }
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Number(amount));
    };

    const formatMonth = (yyyyMm: string) => {
        if (!yyyyMm) return '';
        const [year, m] = yyyyMm.split('-');
        const date = new Date(Number(year), Number(m) - 1);
        return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    };

    // Derived stats
    const totalBudget = budgetData.reduce((sum, item) => sum + Number(item.budget_amount), 0);
    const totalActual = budgetData.reduce((sum, item) => sum + Number(item.actual_amount), 0);
    const totalPercentage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

    return (
        <>
            <Head title="Budget" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 max-w-5xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Budget</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola batas pengeluaran untuk akun beban Anda.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="month-picker" className="sr-only">Month</Label>
                        <Input 
                            id="month-picker"
                            type="month" 
                            value={month} 
                            onChange={(e) => handleMonthChange(e.target.value)} 
                            className="w-[180px]"
                        />
                    </div>
                </div>

                {/* Overall Summary Card */}
                <Card className="bg-muted/30 border-dashed">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Ringkasan Budget {formatMonth(month)}</CardTitle>
                        <CardDescription>Pelacakan di semua akun beban yang dianggarkan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <span className="text-3xl font-bold">{formatCurrency(totalActual)}</span>
                                <span className="text-muted-foreground ml-2">of {formatCurrency(totalBudget)}</span>
                            </div>
                            <div className="text-right">
                                <Badge variant={totalPercentage > 100 ? 'destructive' : totalPercentage > 80 ? 'secondary' : 'default'} className="text-sm">
                                    {totalPercentage.toFixed(1)}% Terpakai
                                </Badge>
                            </div>
                        </div>
                        <Progress 
                            value={Math.min(totalPercentage, 100)} 
                            className={`h-3 ${totalPercentage > 100 ? '[&>div]:bg-destructive' : totalPercentage > 80 ? '[&>div]:bg-orange-500' : '[&>div]:bg-emerald-500'}`}
                        />
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {budgetData.map((item) => {
                        const budget = Number(item.budget_amount);
                        const actual = Number(item.actual_amount);
                        const isBudgetSet = budget > 0 || item.budget !== null;
                        const percentage = budget > 0 ? (actual / budget) * 100 : (actual > 0 ? 100 : 0);
                        
                        let statusColor = 'bg-emerald-500';
                        if (percentage >= 100) statusColor = 'bg-destructive';
                        else if (percentage >= 80) statusColor = 'bg-orange-500';

                        return (
                            <Card key={item.account.id} className="flex flex-col h-full">
                                <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
                                    <div>
                                        <CardTitle className="text-base">{item.account.name}</CardTitle>
                                        {!isBudgetSet && (
                                            <CardDescription className="text-xs mt-1">Budget belum ditetapkan</CardDescription>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7" 
                                            onClick={() => setActiveModalData({ budget: item.budget, account: item.account })}
                                            title={isBudgetSet ? "Ubah Budget" : "Tetapkan Budget"}
                                        >
                                            {isBudgetSet ? <IconEdit className="h-4 w-4" /> : <IconPlus className="h-4 w-4" />}
                                            <span className="sr-only">{isBudgetSet ? "Ubah" : "Tetapkan"}</span>
                                        </Button>
                                        {isBudgetSet && item.budget && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" 
                                                onClick={() => handleDelete(item.budget!)}
                                                title="Hapus Budget"
                                            >
                                                <IconTrash className="h-4 w-4" />
                                                <span className="sr-only">Hapus</span>
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-4 flex-1">
                                    <div className="flex justify-between items-baseline mb-2 text-sm">
                                        <span className="font-semibold text-lg">{formatCurrency(actual)}</span>
                                        {isBudgetSet && (
                                            <span className="text-muted-foreground text-xs">/ {formatCurrency(budget)}</span>
                                        )}
                                    </div>
                                    {isBudgetSet && (
                                        <div className="space-y-1">
                                            <Progress 
                                                value={Math.min(percentage, 100)} 
                                                className={`h-2 [&>div]:${statusColor}`} 
                                            />
                                            <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                                <span>{percentage.toFixed(0)}% Terpakai</span>
                                                <span>{actual > budget ? 'Melebihi Budget' : `${formatCurrency(budget - actual)} Tersisa`}</span>
                                            </div>
                                        </div>
                                    )}
                                    {!isBudgetSet && actual > 0 && (
                                        <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded text-center">
                                            Anda telah menghabiskan {formatCurrency(actual)} bulan ini.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {activeModalData && (
                <BudgetFormModal 
                    isOpen={true}
                    onClose={() => setActiveModalData(null)}
                    budget={activeModalData.budget}
                    account={activeModalData.account}
                    periodMonth={month}
                />
            )}
        </>
    );
}

BudgetsIndex.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
