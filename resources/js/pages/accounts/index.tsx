import { Head, router } from '@inertiajs/react';
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useState } from 'react';
import {
    destroy,
    reorder,
} from '@/actions/App/Http/Controllers/AccountController';
import { AccountBrandIcon } from '@/components/account-brand-icon';
import { AccountFormModal } from '@/components/account-form-modal';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { resolveAccountBrand } from '@/lib/account-brands';
import type { BreadcrumbItem } from '@/types';
import {
    IconPencil,
    IconTrash,
    IconPlus,
    IconWallet,
    IconSearch,
    IconLayoutGrid,
    IconList,
    IconCheck,
    IconGripVertical,
    IconX,
} from '@tabler/icons-react';

type Account = {
    id: number;
    name: string;
    account_type?: { name: string } | null;
    is_active: boolean;
    balance: string;
    sort_order: number;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Akun', href: '/accounts' }];

function SortableAccountRow({
    account,
    onEdit,
    onDelete,
    disabled,
    formatCurrency,
}: {
    account: Account;
    onEdit: (account: Account) => void;
    onDelete: (account: Account) => void;
    disabled: boolean;
    formatCurrency: (value: string | number) => string;
}) {
    const brand = resolveAccountBrand(account.name);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: account.id, disabled });

    return (
        <TableRow
            ref={setNodeRef}
            data-dragging={isDragging}
            className="data-[dragging=true]:relative data-[dragging=true]:z-10 data-[dragging=true]:opacity-70"
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
        >
            <TableCell className="w-12">
                <Button
                    {...attributes}
                    {...listeners}
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    aria-label={`Pindahkan ${account.name}`}
                    className="text-muted-foreground size-11 touch-none hover:bg-transparent"
                >
                    <IconGripVertical aria-hidden="true" />
                    <span className="sr-only">
                        Seret untuk mengubah urutan akun
                    </span>
                </Button>
            </TableCell>
            <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                    <AccountBrandIcon
                        brand={brand}
                        className="size-7 rounded-md"
                        iconClassName="size-5"
                    />
                    <span className="text-foreground font-semibold">
                        {account.name}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <Badge variant="secondary" className="text-xs font-normal">
                    {account.account_type?.name ?? 'Umum'}
                </Badge>
            </TableCell>
            <TableCell>
                <Badge
                    variant={account.is_active ? 'outline' : 'secondary'}
                    className="text-xs"
                >
                    {account.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
            </TableCell>
            <TableCell className="text-right font-mono font-bold tabular-nums">
                {formatCurrency(account.balance)}
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => onEdit(account)}
                    >
                        <IconPencil className="size-3.5" />
                        <span className="sr-only">Ubah</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive size-7"
                        onClick={() => onDelete(account)}
                    >
                        <IconTrash className="size-3.5" />
                        <span className="sr-only">Hapus</span>
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

export default function AccountsIndex({
    accounts = [],
}: {
    accounts: Account[];
}) {
    const [selectedAccount, setSelectedAccount] = useState<
        Account | null | undefined
    >(undefined);
    const [deletingAccount, setDeletingAccount] = useState<Account | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);
    const [isReordering, setIsReordering] = useState(false);
    const [orderedAccounts, setOrderedAccounts] = useState(accounts);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    useEffect(() => {
        setOrderedAccounts(accounts);
    }, [accounts]);

    const formatCurrency = (val: string | number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Number(val));
    };

    const totalBalance = useMemo(() => {
        return orderedAccounts.reduce(
            (sum, acc) => sum + Number(acc.balance || 0),
            0,
        );
    }, [orderedAccounts]);

    const activeCount = useMemo(() => {
        return orderedAccounts.filter((a) => a.is_active).length;
    }, [orderedAccounts]);

    const filteredAccounts = useMemo(() => {
        if (!search.trim()) return orderedAccounts;
        const q = search.toLowerCase();
        return orderedAccounts.filter(
            (a) =>
                a.name.toLowerCase().includes(q) ||
                (a.account_type?.name &&
                    a.account_type.name.toLowerCase().includes(q)),
        );
    }, [orderedAccounts, search]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (isReordering || search.trim() || !over || active.id === over.id) {
            return;
        }

        const previousAccounts = orderedAccounts;
        const oldIndex = orderedAccounts.findIndex(
            (account) => account.id === active.id,
        );
        const newIndex = orderedAccounts.findIndex(
            (account) => account.id === over.id,
        );

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        const nextAccounts = arrayMove(orderedAccounts, oldIndex, newIndex);
        setOrderedAccounts(nextAccounts);
        setIsReordering(true);

        router.put(
            reorder.url(),
            { account_ids: nextAccounts.map((account) => account.id) },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => setOrderedAccounts(previousAccounts),
                onFinish: () => setIsReordering(false),
            },
        );
    };

    const handleDelete = () => {
        if (!deletingAccount) return;
        setIsDeleting(true);
        router.delete(destroy.url(deletingAccount.id), {
            preserveState: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeletingAccount(null);
            },
        });
    };

    return (
        <>
            <Head title="Akun & Rekening" />
            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Title */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Akun Keuangan
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Kelola rekening bank, dompet digital, kartu kredit,
                            dan kas tunai Anda.
                        </p>
                    </div>
                    <Button
                        onClick={() => setSelectedAccount(null)}
                        className="self-start shadow-xs sm:self-auto"
                    >
                        <IconPlus className="mr-1.5 size-4" />
                        Tambah Akun
                    </Button>
                </div>

                {/* Top Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                Total Saldo Seluruh Akun
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold tabular-nums">
                                {formatCurrency(totalBalance)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground pt-0 text-xs">
                            Akumulasi dari {orderedAccounts.length} akun
                            terdaftar
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                Akun Aktif
                            </CardDescription>
                            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                                <IconCheck className="size-5" />
                                {activeCount} Akun
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground pt-0 text-xs">
                            Siap digunakan untuk transaksi harian
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                Akun Nonaktif
                            </CardDescription>
                            <CardTitle className="text-muted-foreground flex items-center gap-2 text-2xl font-bold tabular-nums">
                                <IconX className="size-5" />
                                {orderedAccounts.length - activeCount} Akun
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground pt-0 text-xs">
                            Disimpan untuk arsip riwayat pembukuan
                        </CardContent>
                    </Card>
                </div>

                {/* Toolbar (Search & View Mode Toggle) */}
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="relative w-full sm:w-72">
                        <IconSearch className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
                        <Input
                            placeholder="Cari akun..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 text-sm"
                        />
                    </div>
                    <div className="bg-muted/30 flex items-center gap-1 self-end rounded-lg border p-1 sm:self-auto">
                        <Button
                            type="button"
                            disabled={isReordering}
                            variant={
                                viewMode === 'grid' ? 'secondary' : 'ghost'
                            }
                            size="sm"
                            className="h-7 gap-1.5 px-2.5 text-xs"
                            onClick={() => setViewMode('grid')}
                        >
                            <IconLayoutGrid className="size-3.5" />
                            <span>Kartu</span>
                        </Button>
                        <Button
                            type="button"
                            disabled={isReordering}
                            variant={
                                viewMode === 'table' ? 'secondary' : 'ghost'
                            }
                            size="sm"
                            className="h-7 gap-1.5 px-2.5 text-xs"
                            onClick={() => setViewMode('table')}
                        >
                            <IconList className="size-3.5" />
                            <span>Tabel</span>
                        </Button>
                    </div>
                </div>

                {search.trim() && (
                    <p className="text-muted-foreground text-xs">
                        Hapus pencarian untuk mengubah urutan akun.
                    </p>
                )}

                {/* Content: Grid or Table */}
                {filteredAccounts.length === 0 ? (
                    <Card className="border-border/60 shadow-xs">
                        <CardContent className="text-muted-foreground flex flex-col items-center justify-center p-12 text-center text-sm">
                            <IconWallet className="text-muted-foreground/50 mb-3 size-10" />
                            <p className="text-foreground text-base font-semibold">
                                Tidak ada akun yang ditemukan
                            </p>
                            <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                                {search
                                    ? `Tidak ditemukan akun dengan kata kunci "${search}".`
                                    : 'Mulai dengan menambahkan akun rekening bank, dompet digital, atau uang tunai Anda.'}
                            </p>
                            {!search && (
                                <Button
                                    onClick={() => setSelectedAccount(null)}
                                    size="sm"
                                    className="mt-4"
                                >
                                    <IconPlus className="mr-1.5 size-4" />
                                    Tambah Akun Pertama
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredAccounts.map((acc) => {
                            const brand = resolveAccountBrand(acc.name);

                            return (
                                <Card
                                    key={acc.id}
                                    className={`border-border/60 shadow-xs transition-all hover:shadow-sm ${
                                        !acc.is_active
                                            ? 'bg-muted/20 opacity-60'
                                            : ''
                                    }`}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <AccountBrandIcon
                                                    brand={brand}
                                                    className="size-11 rounded-lg"
                                                    iconClassName="size-6"
                                                />
                                                <div>
                                                    <CardTitle className="text-base font-semibold">
                                                        {acc.name}
                                                    </CardTitle>
                                                    <CardDescription className="mt-0.5 flex items-center gap-1.5 text-xs">
                                                        <span>
                                                            {acc.account_type
                                                                ?.name ||
                                                                'Umum'}
                                                        </span>
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Badge
                                                variant={
                                                    acc.is_active
                                                        ? 'outline'
                                                        : 'secondary'
                                                }
                                                className="text-[10px]"
                                            >
                                                {acc.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-2 pb-4">
                                        <div className="text-muted-foreground mb-1 text-xs">
                                            Saldo Saat Ini:
                                        </div>
                                        <div className="text-foreground font-mono text-xl font-bold tracking-tight">
                                            {formatCurrency(acc.balance)}
                                        </div>
                                    </CardContent>
                                    <div className="bg-muted/10 flex items-center justify-end gap-1 border-t px-4 py-2.5">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-foreground h-8 px-2.5 text-xs"
                                            onClick={() =>
                                                setSelectedAccount(acc)
                                            }
                                        >
                                            <IconPencil className="mr-1 size-3.5" />
                                            Ubah
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2.5 text-xs"
                                            onClick={() =>
                                                setDeletingAccount(acc)
                                            }
                                        >
                                            <IconTrash className="mr-1 size-3.5" />
                                            Hapus
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="border-border/60 overflow-hidden shadow-xs">
                        <CardContent className="p-0">
                            <DndContext
                                collisionDetection={closestCenter}
                                modifiers={[restrictToVerticalAxis]}
                                onDragEnd={handleDragEnd}
                                sensors={sensors}
                            >
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-12">
                                                <span className="sr-only">
                                                    Urutan
                                                </span>
                                            </TableHead>
                                            <TableHead>Nama Akun</TableHead>
                                            <TableHead className="w-36">
                                                Tipe
                                            </TableHead>
                                            <TableHead className="w-28">
                                                Status
                                            </TableHead>
                                            <TableHead className="w-44 text-right">
                                                Saldo
                                            </TableHead>
                                            <TableHead className="w-20 text-right">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <SortableContext
                                        items={filteredAccounts.map(
                                            (account) => account.id,
                                        )}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <TableBody>
                                            {filteredAccounts.map((account) => (
                                                <SortableAccountRow
                                                    key={account.id}
                                                    account={account}
                                                    disabled={
                                                        Boolean(
                                                            search.trim(),
                                                        ) || isReordering
                                                    }
                                                    formatCurrency={
                                                        formatCurrency
                                                    }
                                                    onEdit={setSelectedAccount}
                                                    onDelete={
                                                        setDeletingAccount
                                                    }
                                                />
                                            ))}
                                        </TableBody>
                                    </SortableContext>
                                </Table>
                            </DndContext>
                        </CardContent>
                    </Card>
                )}

                {/* Add/Edit Modal */}
                {selectedAccount !== undefined && (
                    <AccountFormModal
                        isOpen={true}
                        onClose={() => setSelectedAccount(undefined)}
                        account={selectedAccount}
                    />
                )}

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    isOpen={deletingAccount !== null}
                    onClose={() => setDeletingAccount(null)}
                    onConfirm={handleDelete}
                    title="Hapus Akun"
                    description={`Apakah Anda yakin ingin menghapus akun "${deletingAccount?.name}"? Akun hanya dapat dihapus jika belum memiliki catatan transaksi terkait.`}
                    confirmText="Hapus Akun"
                    isLoading={isDeleting}
                />
            </div>
        </>
    );
}

AccountsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
