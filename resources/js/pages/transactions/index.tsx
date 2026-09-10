import { Head, Link, router } from "@inertiajs/react";
import { useCallback, useState, type FormEvent } from "react";
import {
    destroy,
    index as indexRoute,
} from "@/actions/App/Http/Controllers/TransactionController";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTransactionModal } from "@/hooks/use-transaction-modal";
import AppLayout from "@/layouts/app-layout";
import type { BreadcrumbItem } from "@/types";
import {
    IconPencil,
    IconTrash,
    IconPlus,
    IconSearch,
    IconFilter,
    IconRotateClockwise,
    IconArrowsExchange,
    IconArrowDownLeft,
    IconArrowUpRight,
    IconChevronLeft,
    IconChevronRight,
} from "@tabler/icons-react";

type Account = { id: number; name: string };
type Category = { id: number; name: string; type: string };
type Contact = { id: number; name: string };

type Transaction = {
    id: number;
    transaction_date: string;
    amount: string;
    description: string;
    category_id: number;
    account_id: number;
    transfer_account_id: number | null;
    contact_id: number | null;
    action: string | null;
    notes: string | null;
    account?: Account;
    transfer_account?: Account;
    category?: Category;
    contact?: Contact;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedTransactions = {
    data: Transaction[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: PaginationLink[];
};

type Props = {
    transactions: PaginatedTransactions;
    accounts: Account[];
    categories: Category[];
    contacts: Contact[];
    filters: {
        month?: string;
        account_id?: string;
        category_id?: string;
        search?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Transaksi", href: "/transactions" },
];

export default function TransactionsIndex({
    transactions,
    accounts,
    categories,
    filters,
}: Props) {
    const { openModal, openEditModal } = useTransactionModal();

    const [month, setMonth] = useState(filters.month ?? "");
    const [accountId, setAccountId] = useState(filters.account_id ?? "all");
    const [categoryId, setCategoryId] = useState(filters.category_id ?? "all");
    const [search, setSearch] = useState(filters.search ?? "");

    // Delete confirmation state
    const [deletingTransaction, setDeletingTransaction] =
        useState<Transaction | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const applyFilter = useCallback(
        (overrides: Partial<typeof filters> = {}) => {
            const currentMonth =
                overrides.month !== undefined ? overrides.month : month;
            const currentAccount =
                overrides.account_id !== undefined
                    ? overrides.account_id
                    : accountId;
            const currentCategory =
                overrides.category_id !== undefined
                    ? overrides.category_id
                    : categoryId;
            const currentSearch =
                overrides.search !== undefined ? overrides.search : search;

            router.get(
                indexRoute.url(),
                {
                    month: currentMonth || undefined,
                    account_id:
                        currentAccount === "all" || !currentAccount
                            ? undefined
                            : currentAccount,
                    category_id:
                        currentCategory === "all" || !currentCategory
                            ? undefined
                            : currentCategory,
                    search: currentSearch || undefined,
                },
                { preserveState: true },
            );
        },
        [month, accountId, categoryId, search],
    );

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        applyFilter();
    };

    const handleReset = () => {
        setMonth("");
        setAccountId("all");
        setCategoryId("all");
        setSearch("");
        router.get(indexRoute.url(), {}, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deletingTransaction) return;
        setIsDeleting(true);
        router.delete(destroy.url(deletingTransaction.id), {
            preserveState: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeletingTransaction(null);
            },
        });
    };

    const formatCurrency = (val: string | number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Number(val));
    };

    const formatDateTime = (isoString: string) => {
        const d = new Date(isoString);
        return {
            date: d.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),
            time: d.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
    };

    const hasActiveFilters = Boolean(
        month ||
        (accountId && accountId !== "all") ||
        (categoryId && categoryId !== "all") ||
        search,
    );

    return (
        <>
            <Head title="Transaksi" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Header Title */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Riwayat Transaksi
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola mutasi arus kas, pembelanjaan, transfer
                            saldo, dan pelunasan.
                        </p>
                    </div>
                    <Button
                        onClick={openModal}
                        className="shadow-xs self-start sm:self-auto"
                    >
                        <IconPlus className="mr-1.5 size-4" />
                        Tambah Transaksi
                    </Button>
                </div>

                {/* Filter Toolbar */}
                <Card className="border-border/60 shadow-xs">
                    <CardContent className="p-4">
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex flex-col gap-3"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {/* Search */}
                                <div className="relative">
                                    <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari deskripsi..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="pl-9 text-sm"
                                    />
                                </div>

                                {/* Month Filter */}
                                <Input
                                    type="month"
                                    value={month}
                                    onChange={(e) => {
                                        setMonth(e.target.value);
                                        applyFilter({ month: e.target.value });
                                    }}
                                    className="text-sm"
                                />

                                {/* Account Filter */}
                                <Select
                                    value={accountId}
                                    onValueChange={(val) => {
                                        setAccountId(val);
                                        applyFilter({ account_id: val });
                                    }}
                                >
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Semua Akun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua Akun
                                        </SelectItem>
                                        {accounts.map((acc) => (
                                            <SelectItem
                                                key={acc.id}
                                                value={String(acc.id)}
                                            >
                                                {acc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Category Filter */}
                                <Select
                                    value={categoryId}
                                    onValueChange={(val) => {
                                        setCategoryId(val);
                                        applyFilter({ category_id: val });
                                    }}
                                >
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Semua Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua Kategori
                                        </SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem
                                                key={cat.id}
                                                value={String(cat.id)}
                                            >
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Filter Actions */}
                            <div className="flex items-center justify-between pt-1">
                                <div className="text-xs text-muted-foreground">
                                    Menampilkan{" "}
                                    <span className="font-semibold text-foreground">
                                        {transactions.total}
                                    </span>{" "}
                                    transaksi
                                </div>
                                <div className="flex items-center gap-2">
                                    {hasActiveFilters && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleReset}
                                            className="text-xs text-muted-foreground hover:text-foreground h-8"
                                        >
                                            <IconRotateClockwise className="mr-1 size-3.5" />
                                            Reset Filter
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        size="sm"
                                        variant="secondary"
                                        className="h-8"
                                    >
                                        <IconFilter className="mr-1 size-3.5" />
                                        Terapkan
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Transactions Table Card */}
                <Card className="border-border/60 shadow-xs">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-31.25">
                                        Waktu
                                    </TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Akun</TableHead>
                                    <TableHead>Deskripsi & Kontak</TableHead>
                                    <TableHead className="text-right">
                                        Nominal
                                    </TableHead>
                                    <TableHead className="w-21.25 text-right">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="h-36 text-center text-sm text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-1.5">
                                                <p className="font-medium text-foreground">
                                                    Tidak ada transaksi
                                                    ditemukan
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {hasActiveFilters
                                                        ? "Coba sesuaikan filter atau reset pencarian Anda."
                                                        : "Belum ada transaksi yang tercatat. Tekan tombol Tambah Transaksi untuk memulai."}
                                                </p>
                                                {hasActiveFilters && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleReset}
                                                        className="mt-2 text-xs"
                                                    >
                                                        Reset Filter
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.data.map((tx) => {
                                        const type = tx.category?.type;
                                        const isIncome = type === "income";
                                        const isExpense = type === "expense";
                                        const isTransfer = type === "transfer";
                                        const dt = formatDateTime(
                                            tx.transaction_date,
                                        );

                                        return (
                                            <TableRow
                                                key={tx.id}
                                                className="text-xs sm:text-sm"
                                            >
                                                <TableCell className="whitespace-nowrap font-medium text-muted-foreground">
                                                    <div>{dt.date}</div>
                                                    <div className="text-[11px] text-muted-foreground/70">
                                                        {dt.time}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            isIncome
                                                                ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                                                : isExpense
                                                                  ? "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10"
                                                                  : isTransfer
                                                                    ? "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10"
                                                                    : "border-border text-foreground bg-muted"
                                                        }
                                                    >
                                                        {tx.category?.name ??
                                                            "-"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <span className="font-medium">
                                                            {tx.account?.name ??
                                                                "-"}
                                                        </span>
                                                        {isTransfer &&
                                                            tx.transfer_account && (
                                                                <>
                                                                    <IconArrowsExchange className="size-3 text-muted-foreground" />
                                                                    <span className="font-medium text-foreground">
                                                                        {
                                                                            tx
                                                                                .transfer_account
                                                                                .name
                                                                        }
                                                                    </span>
                                                                </>
                                                            )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-medium text-foreground">
                                                            {tx.description ||
                                                                "-"}
                                                        </span>
                                                        {tx.contact && (
                                                            <span className="text-[11px] text-muted-foreground">
                                                                Kontak:{" "}
                                                                {
                                                                    tx.contact
                                                                        .name
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-medium tabular-nums whitespace-nowrap">
                                                    <span
                                                        className={
                                                            isIncome
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : isExpense
                                                                  ? "text-rose-600 dark:text-rose-400"
                                                                  : isTransfer
                                                                    ? "text-blue-600 dark:text-blue-400"
                                                                    : "text-foreground"
                                                        }
                                                    >
                                                        {isIncome
                                                            ? "+"
                                                            : isExpense
                                                              ? "-"
                                                              : ""}
                                                        {formatCurrency(
                                                            tx.amount,
                                                        )}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    tx,
                                                                )
                                                            }
                                                        >
                                                            <IconPencil className="size-3.5" />
                                                            <span className="sr-only">
                                                                Ubah
                                                            </span>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() =>
                                                                setDeletingTransaction(
                                                                    tx,
                                                                )
                                                            }
                                                        >
                                                            <IconTrash className="size-3.5" />
                                                            <span className="sr-only">
                                                                Hapus
                                                            </span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination Bar */}
                        {transactions.last_page > 1 && (
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t p-4 text-xs">
                                <div className="text-muted-foreground">
                                    Menampilkan {transactions.from ?? 0} sampai{" "}
                                    {transactions.to ?? 0} dari{" "}
                                    {transactions.total} transaksi
                                </div>
                                <div className="flex items-center gap-1 self-center sm:self-auto">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1 text-xs"
                                        disabled={!transactions.prev_page_url}
                                        onClick={() =>
                                            transactions.prev_page_url &&
                                            router.get(
                                                transactions.prev_page_url,
                                                {},
                                                { preserveState: true },
                                            )
                                        }
                                    >
                                        <IconChevronLeft className="size-3.5" />
                                        <span>Sebelumnya</span>
                                    </Button>
                                    <span className="px-2 text-muted-foreground">
                                        Hal. {transactions.current_page} /{" "}
                                        {transactions.last_page}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1 text-xs"
                                        disabled={!transactions.next_page_url}
                                        onClick={() =>
                                            transactions.next_page_url &&
                                            router.get(
                                                transactions.next_page_url,
                                                {},
                                                { preserveState: true },
                                            )
                                        }
                                    >
                                        <span>Berikutnya</span>
                                        <IconChevronRight className="size-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deletingTransaction !== null}
                onClose={() => setDeletingTransaction(null)}
                onConfirm={handleDelete}
                title="Hapus Transaksi"
                description={`Apakah Anda yakin ingin menghapus transaksi "${deletingTransaction?.description || "ini"}" sebesar ${
                    deletingTransaction
                        ? formatCurrency(deletingTransaction.amount)
                        : ""
                }? Saldo akun akan disesuaikan kembali.`}
                confirmText="Hapus Transaksi"
                isLoading={isDeleting}
            />
        </>
    );
}

TransactionsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
