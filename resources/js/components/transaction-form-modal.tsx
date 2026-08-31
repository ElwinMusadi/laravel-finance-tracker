import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';

import { store, update } from '@/actions/App/Http/Controllers/TransactionController';

interface Account {
    id: number;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    balance?: string;
}

interface Transaction {
    id: number;
    transaction_date: string;
    amount: string;
    description: string;
    source_account_id: number;
    destination_account_id: number;
    notes: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    transaction?: Transaction | null;
    accounts: Account[];
}

export function TransactionFormModal({ isOpen, onClose, transaction, accounts }: Props) {
    const isEditing = !!transaction;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        transaction_date: new Date().toISOString().split('T')[0] + 'T12:00', // Default to today noon
        amount: '',
        description: '',
        source_account_id: '' as number | '',
        destination_account_id: '' as number | '',
        notes: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (transaction) {
                // Formatting datetime for datetime-local input
                const dt = new Date(transaction.transaction_date);
                // Adjust for local timezone offset to display properly in datetime-local
                const tzOffset = dt.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(dt.getTime() - tzOffset)).toISOString().slice(0, 16);
                
                setData({
                    transaction_date: localISOTime,
                    amount: transaction.amount,
                    description: transaction.description,
                    source_account_id: transaction.source_account_id,
                    destination_account_id: transaction.destination_account_id,
                    notes: transaction.notes || '',
                });
            } else {
                // Reset defaults
                const now = new Date();
                const tzOffset = now.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);
                
                setData({
                    transaction_date: localISOTime,
                    amount: '',
                    description: '',
                    source_account_id: '',
                    destination_account_id: '',
                    notes: '',
                });
            }
            clearErrors();
        }
    }, [isOpen, transaction]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            put(update.url(transaction.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(store.url(), {
                onSuccess: () => onClose(),
            });
        }
    };

    // Group accounts by type for Select dropdowns
    const groupedAccounts = accounts.reduce((acc, account) => {
        if (!acc[account.type]) {
            acc[account.type] = [];
        }
        acc[account.type].push(account);
        return acc;
    }, {} as Record<string, Account[]>);

    const renderAccountOptions = () => {
        const order = ['asset', 'liability', 'revenue', 'expense', 'equity'];
        return order.map((type) => {
            if (!groupedAccounts[type]) return null;
            return (
                <SelectGroup key={type}>
                    <SelectLabel className="uppercase text-xs tracking-wider font-semibold text-muted-foreground bg-muted/50 py-1">
                        {type}
                    </SelectLabel>
                    {groupedAccounts[type].map((account) => (
                        <SelectItem key={account.id} value={String(account.id)}>
                            {account.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            );
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Transaction' : 'Record Transaction'}</DialogTitle>
                        <DialogDescription>
                            {isEditing 
                                ? 'Update the details of this ledger entry.' 
                                : 'Record a new financial transaction between two accounts.'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="transaction_date">Date & Time</Label>
                            <Input
                                id="transaction_date"
                                type="datetime-local"
                                value={data.transaction_date}
                                onChange={(e) => setData('transaction_date', e.target.value)}
                                required
                            />
                            {errors.transaction_date && <p className="text-sm text-destructive">{errors.transaction_date}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="source_account_id">Source (From)</Label>
                                <Select 
                                    value={String(data.source_account_id)} 
                                    onValueChange={(val) => setData('source_account_id', Number(val))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select source account" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {renderAccountOptions()}
                                    </SelectContent>
                                </Select>
                                {errors.source_account_id && <p className="text-sm text-destructive">{errors.source_account_id}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="destination_account_id">Destination (To)</Label>
                                <Select 
                                    value={String(data.destination_account_id)} 
                                    onValueChange={(val) => setData('destination_account_id', Number(val))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select destination account" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {renderAccountOptions()}
                                    </SelectContent>
                                </Select>
                                {errors.destination_account_id && <p className="text-sm text-destructive">{errors.destination_account_id}</p>}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount (IDR)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                placeholder="0.00"
                                required
                            />
                            {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
                        </div>
                        
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="e.g. Monthly Salary, Groceries, Rent"
                                required
                            />
                            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Input
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Any additional details"
                            />
                            {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
                        </div>
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
