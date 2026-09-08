import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconPlus, IconEdit, IconTrash, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useState, useCallback } from 'react';
import { useTransactionModal } from '@/hooks/use-transaction-modal';
import { destroy, index as indexRoute } from '@/actions/App/Http/Controllers/TransactionController';

interface Account {
    id: number;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
}

interface Transaction {
    id: number;
    transaction_date: string;
    amount: string;
    description: string;
    source_account_id: number;
    destination_account_id: number;
    notes: string | null;
    source_account?: Account;
    destination_account?: Account;
}

interface PaginationData {
    current_page: number;
    data: Transaction[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: { url: string | null; label: string; active: boolean }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

interface Props {
    transactions: PaginationData;
    accounts: Account[];
    filters: {
        month?: string;
        account_id?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '/transactions',
    },
];

export default function TransactionsIndex({ transactions, accounts, filters }: Props) {
    const { openModal, openEditModal } = useTransactionModal();

    // Current filters state
    const [month, setMonth] = useState(filters.month || '');
    const [accountId, setAccountId] = useState(filters.account_id || 'all');

    const handleDelete = (transaction: Transaction) => {
        if (confirm(`Apakah Anda yakin ingin menghapus transaksi ini: ${transaction.description}?`)) {
            router.delete(destroy.url(transaction.id), { preserveScroll: true });
        }
    };

    const handleFilter = useCallback(() => {
        const query: Record<string, string> = {};
        if (month) query.month = month;
        if (accountId && accountId !== 'all') query.account_id = accountId;

        router.get(indexRoute.url(), query, { preserveState: true, preserveScroll: true });
    }, [month, accountId]);

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(amount));
    };

    const formatDate = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <Head title="Transaksi" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Transaksi</h1>
                        <p className="text-sm text-muted-foreground">
                            Catat dan lihat aliran uang antar akun Anda.
                        </p>
                    </div>
                    <Button onClick={openModal}>
                        <IconPlus className="mr-2 h-4 w-4" />
                        Catat Transaksi
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-2 bg-muted/30 p-4 rounded-lg border">
                    <div className="flex-1">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Bulan</label>
                        <Input 
                            type="month" 
                            value={month} 
                            onChange={(e) => setMonth(e.target.value)} 
                        />
                    </div>
                    <div className="flex-[2]">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Filter Akun</label>
                        <Select value={accountId} onValueChange={setAccountId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Semua Akun" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">-- Semua Akun --</SelectItem>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={String(acc.id)}>
                                        {acc.name} ({acc.type})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end gap-2">
                        <Button variant="secondary" onClick={handleFilter}>
                            Terapkan Filter
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => {
                                setMonth('');
                                setAccountId('all');
                                router.get(indexRoute.url());
                            }}
                        >
                            Reset
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader className="sr-only">
                        <CardTitle>Daftar Transaksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Deskripsi</TableHead>
                                    <TableHead>Dari</TableHead>
                                    <TableHead>Ke</TableHead>
                                    <TableHead className="text-right">Jumlah</TableHead>
                                    <TableHead className="w-[100px] text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            Belum ada transaksi untuk filter yang dipilih.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.data.map((transaction) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell className="whitespace-nowrap font-medium text-sm">
                                                {formatDate(transaction.transaction_date)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{transaction.description}</span>
                                                    {transaction.notes && (
                                                        <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={transaction.notes}>
                                                            {transaction.notes}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-muted">
                                                    {transaction.source_account?.name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-muted">
                                                    {transaction.destination_account?.name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-medium">
                                                {formatCurrency(transaction.amount)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(transaction)}>
                                                        <IconEdit className="h-4 w-4 text-muted-foreground" />
                                                        <span className="sr-only">Ubah</span>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(transaction)}>
                                                        <IconTrash className="h-4 w-4 text-destructive" />
                                                        <span className="sr-only">Hapus</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                    
                    {transactions.last_page > 1 && (
                        <CardFooter className="flex items-center justify-between p-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {transactions.from || 0} hingga {transactions.to || 0} dari {transactions.total} transaksi
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    disabled={!transactions.prev_page_url}
                                    onClick={() => transactions.prev_page_url && router.get(transactions.prev_page_url, {}, { preserveScroll: true })}
                                >
                                    <IconChevronLeft className="h-4 w-4 mr-1" /> Sebelumnya
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    disabled={!transactions.next_page_url}
                                    onClick={() => transactions.next_page_url && router.get(transactions.next_page_url, {}, { preserveScroll: true })}
                                >
                                    Berikutnya <IconChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </>
    );
}

TransactionsIndex.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
