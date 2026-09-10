import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { ContactFormModal } from "@/components/contact-form-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { destroy } from "@/actions/App/Http/Controllers/ContactController";
import {
    IconPencil,
    IconTrash,
    IconPlus,
    IconSearch,
    IconUsers,
    IconUserCheck,
    IconArrowsExchange,
} from "@tabler/icons-react";

interface Contact {
    id: number;
    name: string;
    is_active: boolean;
    transactions_count: number;
}

interface Props {
    contacts: Contact[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: "Kontak",
        href: "/contacts",
    },
];

export default function ContactsIndex({ contacts = [] }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [deletingContact, setDeletingContact] = useState<Contact | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);
    const [search, setSearch] = useState("");

    const counts = useMemo(() => {
        return {
            total: contacts.length,
            active: contacts.filter((c) => c.is_active).length,
            withTransactions: contacts.filter((c) => c.transactions_count > 0)
                .length,
        };
    }, [contacts]);

    const filteredContacts = useMemo(() => {
        if (!search.trim()) return contacts;
        return contacts.filter((c) =>
            c.name.toLowerCase().includes(search.toLowerCase()),
        );
    }, [contacts, search]);

    const handleDelete = () => {
        if (!deletingContact) return;
        setIsDeleting(true);
        router.delete(destroy.url(deletingContact.id), {
            preserveState: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeletingContact(null);
            },
        });
    };

    return (
        <>
            <Head title="Kontak Relasi" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Daftar Kontak
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Pihak ketiga, debitur, kreditur, atau relasi yang
                            terhubung dengan catatan utang & piutang Anda.
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="shadow-xs self-start sm:self-auto"
                    >
                        <IconPlus className="mr-1.5 size-4" />
                        Tambah Kontak
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Total Kontak Terdaftar
                                </CardDescription>
                                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                    <IconUsers className="size-4" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold tabular-nums">
                                {counts.total} Kontak
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-xs text-muted-foreground">
                            Daftar relasi pinjaman dan piutang Anda
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Kontak Aktif
                                </CardDescription>
                                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <IconUserCheck className="size-4" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                {counts.active} Kontak
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-xs text-muted-foreground">
                            Dapat dipilih pada transaksi utang/piutang baru
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Memiliki Transaksi
                                </CardDescription>
                                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <IconArrowsExchange className="size-4" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold tabular-nums">
                                {counts.withTransactions} Kontak
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-xs text-muted-foreground">
                            Terkait dengan riwayat mutasi keuangan
                        </CardContent>
                    </Card>
                </div>

                {/* Search Toolbar */}
                <div className="flex items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                        <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama kontak..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 text-sm"
                        />
                    </div>
                </div>

                {/* Table */}
                <Card className="border-border/60 shadow-xs overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Nama Kontak</TableHead>
                                    <TableHead className="w-32">
                                        Status
                                    </TableHead>
                                    <TableHead className="w-48">
                                        Riwayat Transaksi
                                    </TableHead>
                                    <TableHead className="w-20 text-right">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredContacts.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="h-32 text-center text-sm text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <IconUsers className="size-8 text-muted-foreground/40 mb-1" />
                                                <p className="font-medium text-foreground">
                                                    Tidak ada kontak ditemukan
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {search
                                                        ? `Tidak ada kontak bernama "${search}".`
                                                        : "Belum ada kontak terdaftar. Tekan Tambah Kontak untuk memulai."}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredContacts.map((contact) => (
                                        <TableRow
                                            key={contact.id}
                                            className="text-xs sm:text-sm"
                                        >
                                            <TableCell className="font-semibold text-foreground">
                                                {contact.name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        contact.is_active
                                                            ? "outline"
                                                            : "secondary"
                                                    }
                                                    className={
                                                        contact.is_active
                                                            ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                                            : ""
                                                    }
                                                >
                                                    {contact.is_active
                                                        ? "Aktif"
                                                        : "Nonaktif"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                <span className="font-medium text-foreground font-mono">
                                                    {contact.transactions_count}
                                                </span>{" "}
                                                transaksi terhubung
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7"
                                                        onClick={() =>
                                                            setEditingContact(
                                                                contact,
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
                                                            setDeletingContact(
                                                                contact,
                                                            )
                                                        }
                                                        disabled={
                                                            contact.transactions_count >
                                                            0
                                                        }
                                                        title={
                                                            contact.transactions_count >
                                                            0
                                                                ? "Kontak tidak dapat dihapus karena memiliki transaksi"
                                                                : "Hapus Kontak"
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
            </div>

            {/* Modal Form */}
            <ContactFormModal
                isOpen={isCreateModalOpen || editingContact !== null}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingContact(null);
                }}
                contact={editingContact}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deletingContact !== null}
                onClose={() => setDeletingContact(null)}
                onConfirm={handleDelete}
                title="Hapus Kontak"
                description={`Apakah Anda yakin ingin menghapus kontak "${deletingContact?.name}"? Tindakan ini hanya dapat dilakukan bila kontak belum memiliki riwayat transaksi.`}
                confirmText="Hapus Kontak"
                isLoading={isDeleting}
            />
        </>
    );
}

ContactsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
