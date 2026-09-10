import { Head, router, useForm } from "@inertiajs/react";
import { useState, useMemo } from "react";
import {
    destroy,
    store,
    update,
} from "@/actions/App/Http/Controllers/CategoryController";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription as ModalDescription,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import AppLayout from "@/layouts/app-layout";
import type { BreadcrumbItem } from "@/types";
import {
    IconPencil,
    IconTrash,
    IconPlus,
    IconSearch,
    IconTags,
    IconArrowDownLeft,
    IconArrowUpRight,
    IconScale,
} from "@tabler/icons-react";

type Category = {
    id: number;
    name: string;
    type: string;
    budget_limit: string | null;
    is_active: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Kategori", href: "/categories" },
];

export default function CategoriesIndex({
    categories = [],
}: {
    categories: Category[];
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    const form = useForm({
        name: "",
        type: "expense",
        budget_limit: "",
        is_active: true,
    });

    const openCreateModal = () => {
        setEditingCategory(null);
        form.setData({
            name: "",
            type: "expense",
            budget_limit: "",
            is_active: true,
        });
        form.clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (cat: Category) => {
        setEditingCategory(cat);
        form.setData({
            name: cat.name,
            type: cat.type,
            budget_limit: cat.budget_limit ?? "",
            is_active: cat.is_active,
        });
        form.clearErrors();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        form.reset();
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (editingCategory) {
            form.put(update.url(editingCategory.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            form.post(store.url(), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = () => {
        if (!deletingCategory) return;
        setIsDeleting(true);
        router.delete(destroy.url(deletingCategory.id), {
            preserveState: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeletingCategory(null);
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

    const counts = useMemo(() => {
        return {
            total: categories.length,
            income: categories.filter((c) => c.type === "income").length,
            expense: categories.filter((c) => c.type === "expense").length,
            debtReceivable: categories.filter(
                (c) => c.type === "debt" || c.type === "receivable",
            ).length,
        };
    }, [categories]);

    const filteredCategories = useMemo(() => {
        return categories.filter((cat) => {
            const matchesSearch = cat.name
                .toLowerCase()
                .includes(search.toLowerCase());
            const matchesType = typeFilter === "all" || cat.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [categories, search, typeFilter]);

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "income":
                return (
                    <Badge
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                    >
                        Pemasukan
                    </Badge>
                );
            case "expense":
                return (
                    <Badge
                        variant="outline"
                        className="border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10"
                    >
                        Pengeluaran
                    </Badge>
                );
            case "debt":
                return (
                    <Badge
                        variant="outline"
                        className="border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                    >
                        Utang
                    </Badge>
                );
            case "receivable":
                return (
                    <Badge
                        variant="outline"
                        className="border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10"
                    >
                        Piutang
                    </Badge>
                );
            case "transfer":
                return (
                    <Badge
                        variant="outline"
                        className="border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10"
                    >
                        Transfer
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{type}</Badge>;
        }
    };

    return (
        <>
            <Head title="Kategori Keuangan" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Header Title */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Kategori Transaksi
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Klasifikasikan mutasi dana Anda untuk analisis
                            laporan dan kontrol anggaran belanja.
                        </p>
                    </div>
                    <Button
                        onClick={openCreateModal}
                        className="shadow-xs self-start sm:self-auto"
                    >
                        <IconPlus className="mr-1.5 size-4" />
                        Tambah Kategori
                    </Button>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Kategori Pengeluaran
                                </CardDescription>
                                <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                    <IconArrowUpRight className="size-4" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold tabular-nums">
                                {counts.expense} Kategori
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-xs text-muted-foreground">
                            Digunakan untuk mengontrol anggaran belanja
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Kategori Pemasukan
                                </CardDescription>
                                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <IconArrowDownLeft className="size-4" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                {counts.income} Kategori
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-xs text-muted-foreground">
                            Sumber pendapatan dan aliran kas masuk
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Utang & Piutang
                                </CardDescription>
                                <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <IconScale className="size-4" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold tabular-nums">
                                {counts.debtReceivable} Kategori
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-xs text-muted-foreground">
                            Peminjaman dan tagihan piutang pihak ketiga
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                        <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari kategori..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 text-sm"
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <Select
                            value={typeFilter}
                            onValueChange={setTypeFilter}
                        >
                            <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Semua Tipe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tipe</SelectItem>
                                <SelectItem value="expense">
                                    Pengeluaran
                                </SelectItem>
                                <SelectItem value="income">
                                    Pemasukan
                                </SelectItem>
                                <SelectItem value="debt">Utang</SelectItem>
                                <SelectItem value="receivable">
                                    Piutang
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <Card className="border-border/60 shadow-xs overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Nama Kategori</TableHead>
                                    <TableHead className="w-36">Tipe</TableHead>
                                    <TableHead className="w-48">
                                        Batas Budget Bulanan
                                    </TableHead>
                                    <TableHead className="w-28">
                                        Status
                                    </TableHead>
                                    <TableHead className="w-20 text-right">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCategories.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="h-32 text-center text-sm text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <IconTags className="size-8 text-muted-foreground/40 mb-1" />
                                                <p className="font-medium text-foreground">
                                                    Tidak ada kategori ditemukan
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {search ||
                                                    typeFilter !== "all"
                                                        ? "Coba sesuaikan kata kunci atau filter tipe."
                                                        : "Belum ada kategori. Tekan Tambah Kategori untuk membuat."}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCategories.map((cat) => (
                                        <TableRow
                                            key={cat.id}
                                            className="text-xs sm:text-sm"
                                        >
                                            <TableCell className="font-semibold text-foreground">
                                                {cat.name}
                                            </TableCell>
                                            <TableCell>
                                                {getTypeBadge(cat.type)}
                                            </TableCell>
                                            <TableCell className="font-mono tabular-nums">
                                                {cat.budget_limit ? (
                                                    <span className="font-medium">
                                                        {formatCurrency(
                                                            cat.budget_limit,
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        cat.is_active
                                                            ? "outline"
                                                            : "secondary"
                                                    }
                                                    className="text-[10px]"
                                                >
                                                    {cat.is_active
                                                        ? "Aktif"
                                                        : "Nonaktif"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7"
                                                        onClick={() =>
                                                            openEditModal(cat)
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
                                                            setDeletingCategory(
                                                                cat,
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
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Create/Edit Category Modal */}
                <Dialog
                    open={isModalOpen}
                    onOpenChange={(open) => !open && closeModal()}
                >
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingCategory
                                        ? "Ubah Kategori"
                                        : "Tambah Kategori Baru"}
                                </DialogTitle>
                                <ModalDescription className="text-xs text-muted-foreground pt-1">
                                    {editingCategory
                                        ? "Perbarui detail nama, tipe, atau batas budget kategori ini."
                                        : "Tentukan nama dan kelompok tipe untuk klasifikasi transaksi Anda."}
                                </ModalDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="cat_name"
                                        className="text-xs"
                                    >
                                        Nama Kategori
                                    </Label>
                                    <Input
                                        id="cat_name"
                                        placeholder="Contoh: Makanan & Minuman"
                                        value={form.data.name}
                                        onChange={(e) =>
                                            form.setData("name", e.target.value)
                                        }
                                        className="text-sm"
                                        autoFocus
                                    />
                                    {form.errors.name && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="cat_type"
                                        className="text-xs"
                                    >
                                        Tipe Kategori
                                    </Label>
                                    <Select
                                        value={form.data.type}
                                        onValueChange={(val) =>
                                            form.setData("type", val)
                                        }
                                    >
                                        <SelectTrigger
                                            id="cat_type"
                                            className="text-sm"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="expense">
                                                Pengeluaran (Expense)
                                            </SelectItem>
                                            <SelectItem value="income">
                                                Pemasukan (Income)
                                            </SelectItem>
                                            <SelectItem value="debt">
                                                Utang (Debt)
                                            </SelectItem>
                                            <SelectItem value="receivable">
                                                Piutang (Receivable)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {form.errors.type && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.type}
                                        </p>
                                    )}
                                </div>

                                {form.data.type === "expense" && (
                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="cat_budget"
                                            className="text-xs"
                                        >
                                            Batas Budget Bulanan (Opsional - Rp)
                                        </Label>
                                        <Input
                                            id="cat_budget"
                                            type="number"
                                            min="0"
                                            step="1000"
                                            placeholder="Kosongkan jika tidak ada batas"
                                            value={form.data.budget_limit}
                                            onChange={(e) =>
                                                form.setData(
                                                    "budget_limit",
                                                    e.target.value,
                                                )
                                            }
                                            className="text-sm font-mono"
                                        />
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeModal}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    {form.processing
                                        ? "Menyimpan..."
                                        : editingCategory
                                          ? "Perbarui Kategori"
                                          : "Simpan Kategori"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    isOpen={deletingCategory !== null}
                    onClose={() => setDeletingCategory(null)}
                    onConfirm={handleDelete}
                    title="Hapus Kategori"
                    description={`Apakah Anda yakin ingin menghapus kategori "${deletingCategory?.name}"? Kategori yang telah terhubung dengan transaksi tidak dapat dihapus.`}
                    confirmText="Hapus Kategori"
                    isLoading={isDeleting}
                />
            </div>
        </>
    );
}

CategoriesIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
