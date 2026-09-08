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
        title: 'Contacts',
        href: '/contacts',
    },
];

export default function ContactsIndex({ contacts }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    const handleDelete = (contact: Contact) => {
        if (confirm(`Are you sure you want to delete ${contact.name}?`)) {
            router.delete(destroy.url(contact.id));
        }
    };

    return (
        <>
            <Head title="Contacts" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage people or organizations you lend money to or borrow from.
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <IconPlus className="mr-2 h-4 w-4" />
                        Add Contact
                    </Button>
                </div>

                <Card>
                    <CardHeader className="sr-only">
                        <CardTitle>Contacts List</CardTitle>
                        <CardDescription>All registered contacts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Linked Accounts</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No contacts found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    contacts.map((contact) => (
                                        <TableRow key={contact.id}>
                                            <TableCell className="font-medium">{contact.name}</TableCell>
                                            <TableCell>
                                                {contact.is_active ? (
                                                    <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Inactive</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {contact.accounts?.length || 0} account(s)
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingContact(contact)}>
                                                        <IconEdit className="h-4 w-4 text-muted-foreground" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(contact)} disabled={contact.accounts && contact.accounts.length > 0}>
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
