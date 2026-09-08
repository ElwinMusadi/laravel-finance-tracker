import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { ContactFormModal } from '@/components/contact-form-modal';
import { destroy } from '@/actions/App/Http/Controllers/ContactController';

interface Contact {
    id: number;
    name: string;
    is_active: boolean;
    accounts?: any[];
}

interface Props {
    contacts: Contact[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kontak',
        href: '/contacts',
    },
];

export default function ContactsIndex({ contacts }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    const handleDelete = (contact: Contact) => {
        if (confirm(`Apakah Anda yakin ingin menghapus ${contact.name}?`)) {
            router.delete(destroy.url(contact.id));
        }
    };

    return (
        <>
            <Head title="Kontak" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Kontak</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola orang atau organisasi yang Anda pinjami atau pinjam dari mereka.
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <IconPlus className="mr-2 h-4 w-4" />
                        Tambah Kontak
                    </Button>
                </div>

                <Card>
                    <CardHeader className="sr-only">
                        <CardTitle>Daftar Kontak</CardTitle>
                        <CardDescription>Semua kontak terdaftar.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Akun Terhubung</TableHead>
                                    <TableHead className="w-[100px] text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            Belum ada kontak.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    contacts.map((contact) => (
                                        <TableRow key={contact.id}>
                                            <TableCell className="font-medium">{contact.name}</TableCell>
                                            <TableCell>
                                                {contact.is_active ? (
                                                    <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Aktif</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Nonaktif</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {contact.accounts?.length || 0} akun
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingContact(contact)}>
                                                        <IconEdit className="h-4 w-4 text-muted-foreground" />
                                                        <span className="sr-only">Ubah</span>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(contact)} disabled={contact.accounts && contact.accounts.length > 0}>
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
                </Card>
            </div>

            <ContactFormModal 
                isOpen={isCreateModalOpen || editingContact !== null}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingContact(null);
                }}
                contact={editingContact}
            />
        </>
    );
}

ContactsIndex.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
