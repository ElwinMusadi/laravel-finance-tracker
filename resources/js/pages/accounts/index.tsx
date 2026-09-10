import { Head, router } from "@inertiajs/react";
import { useState, useMemo } from "react";
import { destroy } from "@/actions/App/Http/Controllers/AccountController";
import { AccountFormModal } from "@/components/account-form-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";
import type { BreadcrumbItem } from "@/types";
import {
    IconPencil,
    IconTrash,
    IconPlus,
    IconWallet,
    IconBuildingBank,
    IconCreditCard,
    IconCash,
    IconSearch,
    IconLayoutGrid,
    IconList,
    IconCheck,
    IconX,
} from "@tabler/icons-react";

type Account = {
    id: number;
    name: string;
    account_type?: { name: string } | null;
    is_active: boolean;
    balance: string;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: "Akun", href: "/accounts" }];

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
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

    const formatCurrency = (val: string | number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Number(val));
    };

    const totalBalance = useMemo(() => {
        return accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
    }, [accounts]);

    const activeCount = useMemo(() => {
        return accounts.filter((a) => a.is_active).length;
    }, [accounts]);

    const filteredAccounts = useMemo(() => {
        if (!search.trim()) return accounts;
        const q = search.toLowerCase();
        return accounts.filter(
            (a) =>
                a.name.toLowerCase().includes(q) ||
                (a.account_type?.name &&
                    a.account_type.name.toLowerCase().includes(q)),
        );
    }, [accounts, search]);

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

    const getAccountIcon = (type?: string | null) => {
        const t = (type || "").toLowerCase();
        if (t.includes("bank"))
            return <IconBuildingBank className="size-5 text-primary" />;
        if (
            t.includes("wallet") ||
            t.includes("dompet") ||
            t.includes("gopay") ||
            t.includes("ovo")
        )
            return (
                <IconCreditCard className="size-5 text-emerald-600 dark:text-emerald-400" />
            );
        if (t.includes("kas") || t.includes("cash") || t.includes("tunai"))
            return (
                <IconCash className="size-5 text-amber-600 dark:text-amber-400" />
            );
        return <IconWallet className="size-5 text-primary" />;
    };

    return (
        <>
            <Head title="Akun & Rekening" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Header Title */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Akun Keuangan
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola rekening bank, dompet digital, kartu kredit,
                            dan kas tunai Anda.
                        </p>
                    </div>
                    <Button
                        onClick={() => setSelectedAccount(null)}
                        className="shadow-xs self-start sm:self-auto"
                    >
                        <IconPlus className="mr-1.5 size-4" />
                        Tambah Akun
                    </Button>
                </div>

                {/* Top Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Total Saldo Seluruh Akun
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold tabular-nums">
                                {formatCurrency(totalBalance)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-xs text-muted-foreground">
                            Akumulasi dari {accounts.length} akun terdaftar
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Akun Aktif
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                <IconCheck className="size-5" />
                                {activeCount} Akun
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-xs text-muted-foreground">
                            Siap digunakan untuk transaksi harian
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Akun Nonaktif
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold tabular-nums text-muted-foreground flex items-center gap-2">
                                <IconX className="size-5" />
                                {accounts.length - activeCount} Akun
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-xs text-muted-foreground">
                            Disimpan untuk arsip riwayat pembukuan
                        </CardContent>
                    </Card>
                </div>

                {/* Toolbar (Search & View Mode Toggle) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                        <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari akun..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/30 self-end sm:self-auto">
                        <Button
                            type="button"
                            variant={
                                viewMode === "grid" ? "secondary" : "ghost"
                            }
                            size="sm"
                            className="h-7 px-2.5 text-xs gap-1.5"
                            onClick={() => setViewMode("grid")}
                        >
                            <IconLayoutGrid className="size-3.5" />
                            <span>Kartu</span>
                        </Button>
                        <Button
                            type="button"
                            variant={
                                viewMode === "table" ? "secondary" : "ghost"
                            }
                            size="sm"
                            className="h-7 px-2.5 text-xs gap-1.5"
                            onClick={() => setViewMode("table")}
                        >
                            <IconList className="size-3.5" />
                            <span>Tabel</span>
                        </Button>
                    </div>
                </div>

                {/* Content: Grid or Table */}
                {filteredAccounts.length === 0 ? (
                    <Card className="border-border/60 shadow-xs">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-sm text-muted-foreground">
                            <IconWallet className="size-10 text-muted-foreground/50 mb-3" />
                            <p className="font-semibold text-foreground text-base">
                                Tidak ada akun yang ditemukan
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                {search
                                    ? `Tidak ditemukan akun dengan kata kunci "${search}".`
                                    : "Mulai dengan menambahkan akun rekening bank, dompet digital, atau uang tunai Anda."}
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
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAccounts.map((acc) => (
                            <Card
                                key={acc.id}
                                className={`border-border/60 shadow-xs transition-all hover:shadow-sm ${
                                    !acc.is_active
                                        ? "opacity-60 bg-muted/20"
                                        : ""
                                }`}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-lg bg-primary/10">
                                                {getAccountIcon(
                                                    acc.account_type?.name,
                                                )}
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-semibold">
                                                    {acc.name}
                                                </CardTitle>
                                                <CardDescription className="text-xs flex items-center gap-1.5 mt-0.5">
                                                    <span>
                                                        {acc.account_type
                                                            ?.name || "Umum"}
                                                    </span>
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge
                                            variant={
                                                acc.is_active
                                                    ? "outline"
                                                    : "secondary"
                                            }
                                            className="text-[10px]"
                                        >
                                            {acc.is_active
                                                ? "Aktif"
                                                : "Nonaktif"}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-2 pb-4">
                                    <div className="text-xs text-muted-foreground mb-1">
                                        Saldo Saat Ini:
                                    </div>
                                    <div className="text-xl font-bold font-mono tracking-tight text-foreground">
                                        {formatCurrency(acc.balance)}
                                    </div>
                                </CardContent>
                                <div className="border-t px-4 py-2.5 flex items-center justify-end gap-1 bg-muted/10">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                                        onClick={() => setSelectedAccount(acc)}
                                    >
                                        <IconPencil className="mr-1 size-3.5" />
                                        Ubah
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => setDeletingAccount(acc)}
                                    >
                                        <IconTrash className="mr-1 size-3.5" />
                                        Hapus
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-border/60 shadow-xs overflow-hidden">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
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
                                <TableBody>
                                    {filteredAccounts.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {getAccountIcon(
                                                        item.account_type?.name,
                                                    )}
                                                    <span className="font-semibold text-foreground">
                                                        {item.name}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs font-normal"
                                                >
                                                    {item.account_type?.name ??
                                                        "Umum"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        item.is_active
                                                            ? "outline"
                                                            : "secondary"
                                                    }
                                                    className="text-xs"
                                                >
                                                    {item.is_active
                                                        ? "Aktif"
                                                        : "Nonaktif"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold tabular-nums">
                                                {formatCurrency(item.balance)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7"
                                                        onClick={() =>
                                                            setSelectedAccount(
                                                                item,
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
                                                            setDeletingAccount(
                                                                item,
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
                                    ))}
                                </TableBody>
                            </Table>
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
