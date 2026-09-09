import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { destroy } from '@/actions/App/Http/Controllers/BudgetController';
import { BudgetFormModal } from '@/components/budget-form-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Pencil, Trash2 } from 'lucide-react';

type Category = { id: number; name: string; budget_limit: string | null };
type Item = { category: Category; budget_amount: string; actual_amount: string };
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Budget', href: '/budgets' }];

export default function BudgetsIndex({ budgetData, currentMonth }: { budgetData: Item[]; currentMonth: string }) {
    const [month, setMonth] = useState(currentMonth);
    const [category, setCategory] = useState<Category | null>(null);

    return (
        <>
            <Head title="Budget" />
            <div className="p-4 md:p-6">
                <div className="mb-4 flex justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Budget</h1>
                        <p className="text-sm text-muted-foreground">Batas budget aktif per kategori pengeluaran.</p>
                    </div>
                    <Input
                        className="w-40"
                        type="month"
                        value={month}
                        onChange={(event) => {
                            setMonth(event.target.value);
                            router.get('/budgets', { month: event.target.value });
                        }}
                    />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {budgetData.map((item) => (
                        <Card key={item.category.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <strong>{item.category.name}</strong>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => setCategory(item.category)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Ubah</span>
                                        </Button>
                                        {item.category.budget_limit && (
                                            <Button variant="ghost" size="icon" onClick={() => router.delete(destroy.url(item.category.id))}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                <span className="sr-only">Hapus budget</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <p className="mt-4 text-lg">
                                    {Number(item.actual_amount).toLocaleString('id-ID')} /{' '}
                                    {item.category.budget_limit ? Number(item.budget_amount).toLocaleString('id-ID') : '-'}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                {category && <BudgetFormModal isOpen onClose={() => setCategory(null)} category={category} />}
            </div>
        </>
    );
}

BudgetsIndex.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
