import { Head, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { destroy, index as indexRoute } from '@/actions/App/Http/Controllers/TransactionController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTransactionModal } from '@/hooks/use-transaction-modal';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Pencil, Trash2 } from 'lucide-react';

type Account = { id: number; name: string };
type Category = { id: number; name: string; type: string };
type Contact = { id: number; name: string };
type Transaction = {
    id: number; transaction_date: string; amount: string; description: string;
    category_id: number; account_id: number; transfer_account_id: number | null;
    contact_id: number | null; action: string | null;
    account?: Account; transfer_account?: Account; category?: Category; contact?: Contact;
};
type Props = {
    transactions: { data: Transaction[] }; accounts: Account[];
    categories: Category[]; contacts: Contact[];
    filters: { month?: string; account_id?: string };
};
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Transaksi', href: '/transactions' }];

export default function TransactionsIndex({ transactions, accounts, filters }: Props) {
    const { openModal, openEditModal } = useTransactionModal();
    const [month, setMonth] = useState(filters.month ?? '');
    const [accountId, setAccountId] = useState(filters.account_id ?? 'all');
    const filter = useCallback(
        () => router.get(indexRoute.url(), { month, account_id: accountId === 'all' ? undefined : accountId }, { preserveState: true }),
        [month, accountId],
    );

    return (
        <>
            <Head title="Transaksi" />
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Transaksi</h1>
                        <p className="text-sm text-muted-foreground">Catat transaksi berdasarkan kategori.</p>
                    </div>
                    <Button onClick={openModal}>Tambah Transaksi</Button>
                </div>
                <Card>
                    <CardHeader>
                        <div className="flex gap-2">
                            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
                            <Select value={accountId} onValueChange={setAccountId}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua akun</SelectItem>
                                    {accounts.map((account) => (
                                        <SelectItem key={account.id} value={String(account.id)}>{account.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={filter}>Filter</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead><TableHead>Kategori</TableHead>
                                    <TableHead>Akun</TableHead><TableHead>Kontak</TableHead>
                                    <TableHead>Jumlah</TableHead><TableHead>Deskripsi</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.data.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell>{new Date(transaction.transaction_date).toLocaleDateString('id-ID')}</TableCell>
                                        <TableCell>{transaction.category?.name}</TableCell>
                                        <TableCell>
                                            {transaction.account?.name}
                                            {transaction.transfer_account ? ` → ${transaction.transfer_account.name}` : ''}
                                        </TableCell>
                                        <TableCell>{transaction.contact?.name ?? '-'}</TableCell>
                                        <TableCell>{Number(transaction.amount).toLocaleString('id-ID')}</TableCell>
                                        <TableCell>{transaction.description}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEditModal(transaction)}>
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sr-only">Ubah</span>
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => router.delete(destroy.url(transaction.id))}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                    <span className="sr-only">Hapus</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

TransactionsIndex.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
