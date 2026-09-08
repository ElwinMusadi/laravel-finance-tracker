import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { store, update } from '@/actions/App/Http/Controllers/TransactionController';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Account = { id: number; name: string };
type Contact = { id: number; name: string };
type Category = { id: number; name: string; type: string };
type Transaction = { id: number; transaction_date: string; amount: string; description: string; category_id: number; account_id: number; transfer_account_id: number | null; contact_id: number | null; action: string | null; notes: string | null };

export function TransactionFormModal({ isOpen, onClose, transaction, accounts, categories, contacts }: { isOpen: boolean; onClose: () => void; transaction?: Transaction | null; accounts: Account[]; categories: Category[]; contacts: Contact[] }) {
    const form = useForm({ transaction_date: '', amount: '', description: '', category_id: '' as number | '', account_id: '' as number | '', transfer_account_id: '' as number | '', contact_id: '' as number | '', action: '', notes: '' });
    const category = categories.find((item) => item.id === form.data.category_id);
    const needsContact = category?.type === 'debt' || category?.type === 'receivable';
    const isTransfer = category?.type === 'transfer';

    useEffect(() => {
        if (!isOpen) return;
        const current = transaction ? new Date(transaction.transaction_date) : new Date();
        const value = new Date(current.getTime() - current.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        form.setData(transaction ? { transaction_date: value, amount: transaction.amount, description: transaction.description, category_id: transaction.category_id, account_id: transaction.account_id, transfer_account_id: transaction.transfer_account_id ?? '', contact_id: transaction.contact_id ?? '', action: transaction.action ?? '', notes: transaction.notes ?? '' } : { transaction_date: value, amount: '', description: '', category_id: '', account_id: '', transfer_account_id: '', contact_id: '', action: '', notes: '' });
        form.clearErrors();
    }, [isOpen, transaction]);

    const submit = (event: React.FormEvent) => { event.preventDefault(); transaction ? form.put(update.url(transaction.id), { onSuccess: onClose }) : form.post(store.url(), { onSuccess: onClose }); };
    const options = (items: Account[] | Contact[] | Category[]) => items.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>);

    return <Dialog open={isOpen} onOpenChange={onClose}><DialogContent><form onSubmit={submit}><DialogHeader><DialogTitle>{transaction ? 'Ubah Transaksi' : 'Catat Transaksi'}</DialogTitle></DialogHeader><div className="grid gap-3 py-4">
        <Label>Kategori</Label><Select value={String(form.data.category_id)} onValueChange={(value) => form.setData('category_id', Number(value))}><SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger><SelectContent>{options(categories)}</SelectContent></Select>
        <Label>Akun</Label><Select value={String(form.data.account_id)} onValueChange={(value) => form.setData('account_id', Number(value))}><SelectTrigger><SelectValue placeholder="Pilih akun" /></SelectTrigger><SelectContent>{options(accounts)}</SelectContent></Select>
        {isTransfer && <><Label>Akun Tujuan</Label><Select value={String(form.data.transfer_account_id)} onValueChange={(value) => form.setData('transfer_account_id', Number(value))}><SelectTrigger><SelectValue placeholder="Pilih akun tujuan" /></SelectTrigger><SelectContent>{options(accounts)}</SelectContent></Select></>}
        {needsContact && <><Label>Kontak</Label><Select value={String(form.data.contact_id)} onValueChange={(value) => form.setData('contact_id', Number(value))}><SelectTrigger><SelectValue placeholder="Pilih kontak" /></SelectTrigger><SelectContent>{options(contacts)}</SelectContent></Select><Label>Aksi</Label><Select value={form.data.action} onValueChange={(value) => form.setData('action', value)}><SelectTrigger><SelectValue placeholder="Pilih aksi" /></SelectTrigger><SelectContent>{(category?.type === 'debt' ? [['receive_loan', 'Menerima pinjaman'], ['repay_debt', 'Membayar utang']] : [['give_loan', 'Memberi pinjaman'], ['receive_repayment', 'Menerima pelunasan']]).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></>}
        <Label>Jumlah</Label><Input type="number" min="0.01" step="0.01" value={form.data.amount} onChange={(event) => form.setData('amount', event.target.value)} />
        <Label>Deskripsi</Label><Input value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} />
        <Label>Tanggal</Label><Input type="datetime-local" value={form.data.transaction_date} onChange={(event) => form.setData('transaction_date', event.target.value)} />
    </div><DialogFooter><Button type="button" variant="outline" onClick={onClose}>Batal</Button><Button disabled={form.processing}>Simpan</Button></DialogFooter></form></DialogContent></Dialog>;
}
