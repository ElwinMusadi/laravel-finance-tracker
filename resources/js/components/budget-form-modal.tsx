import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { store, update } from '@/actions/App/Http/Controllers/BudgetController';

interface Account {
    id: number;
    name: string;
}

interface Budget {
    id: number;
    account_id: number;
    period_month: string;
    amount: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    budget?: Budget | null;
    account: Account;
    periodMonth: string; // YYYY-MM
}

export function BudgetFormModal({ isOpen, onClose, budget, account, periodMonth }: Props) {
    const isEditing = !!budget;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        account_id: account.id,
        period_month: periodMonth,
        amount: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (budget) {
                setData({
                    account_id: budget.account_id,
                    period_month: budget.period_month.substring(0, 7), // Ensure YYYY-MM
                    amount: budget.amount,
                });
            } else {
                setData({
                    account_id: account.id,
                    period_month: periodMonth,
                    amount: '',
                });
            }
            clearErrors();
        }
    }, [isOpen, budget, account, periodMonth]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing && budget) {
            put(update.url(budget.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(store.url(), {
                onSuccess: () => onClose(),
            });
        }
    };

    const formatMonth = (yyyyMm: string) => {
        if (!yyyyMm) return '';
        const [year, month] = yyyMm.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Update Budget' : 'Set Budget'}</DialogTitle>
                        <DialogDescription>
                            Set the maximum spending limit for <strong>{account.name}</strong> in {formatMonth(periodMonth)}.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Budget Amount (IDR)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                placeholder="0.00"
                                required
                            />
                            {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
                        </div>
                        {/* Hidden fields just in case backend complains about missing required fields */}
                        <input type="hidden" name="account_id" value={data.account_id} />
                        <input type="hidden" name="period_month" value={data.period_month} />
                    </div>
                    
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
