import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { AccountFormModal } from '@/components/account-form-modal';
import { destroy } from '@/actions/App/Http/Controllers/AccountController';

interface Contact {
    id: number;
    name: string;
}

interface Account {
    id: number;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    contact_id: number | null;
    is_active: boolean;
    balance?: string;
    contact?: Contact;
}

interface Props {
    accounts: Account[];
    contacts: Contact[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Akun',
        href: '/accounts',
    },
];

export default function AccountsIndex({ accounts, contacts }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);

    const handleDelete = (account: Account) => {
        if (confirm(`Apakah Anda yakin ingin menghapus ${account.name}?`)) {
            router.delete(destroy.url(account.id));
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'asset': return 'bg-blue-500 hover:bg-blue-600';
            case 'liability': return 'bg-red-500 hover:bg-red-600';
            case 'revenue': return 'bg-emerald-500 hover:bg-emerald-600';
            case 'expense': return 'bg-orange-500 hover:bg-orange-600';
            case 'equity': return 'bg-purple-500 hover:bg-purple-600';
            default: return 'bg-gray-500';
        }
    };

    const getTypeLabel = (type: Account['type']) => {
        const labels: Record<Account['type'], string> = {
            asset: 'Aset',
            liability: 'Liabilitas',
            revenue: 'Pendapatan',
            expense: 'Beban',
            equity: 'Ekuitas',
        };

        return labels[type];
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Number(amount));
    };

    return (
        <>
            <Head title="Akun" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Akun</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola bagan akun Anda (Aset, Liabilitas, Pendapatan, Pengeluaran).
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <IconPlus className="mr-2 h-4 w-4" />
                        Tambah Akun
                    </Button>
                </div>

                <Card>
                    <CardHeader className="sr-only">
                        <CardTitle>Daftar Akun</CardTitle>
                        <CardDescription>Semua bagan akun.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Kontak</TableHead>
                                    <TableHead className="text-right">Saldo</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px] text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accounts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            Belum ada akun.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    accounts.map((account) => (
                                        <TableRow key={account.id}>
                                            <TableCell className="font-medium">{account.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="default" className={getTypeColor(account.type)}>
                                                    {getTypeLabel(account.type)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {account.contact ? account.contact.name : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-medium">
                                                {formatCurrency(account.balance || '0')}
                                            </TableCell>
                                            <TableCell>
                                                {account.is_active ? (
                                                    <Badge variant="outline" className="text-emerald-600 border-emerald-600">Aktif</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Nonaktif</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingAccount(account)}>
                                                        <IconEdit className="h-4 w-4 text-muted-foreground" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(account)} disabled={Number(account.balance) !== 0}>
                                                        <IconTrash className="h-4 w-4 text-destructive" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <AccountFormModal 
                isOpen={isCreateModalOpen || editingAccount !== null}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingAccount(null);
                }}
                account={editingAccount}
                contacts={contacts}
            />
        </>
    );
}

AccountsIndex.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
