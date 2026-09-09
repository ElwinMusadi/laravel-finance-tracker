import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { destroy, store, update } from '@/actions/App/Http/Controllers/CategoryController';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Pencil, Trash2 } from 'lucide-react';

type Category = { id: number; name: string; type: string; budget_limit: string | null; is_active: boolean };
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Kategori', href: '/categories' }];

export default function CategoriesIndex({ categories }: { categories: Category[] }) {
    const [editing, setEditing] = useState<Category | null>(null);
    const form = useForm({ name: '', type: 'expense', budget_limit: '', is_active: true });

    const edit = (category: Category) => {
        setEditing(category);
        form.setData({ name: category.name, type: category.type, budget_limit: category.budget_limit ?? '', is_active: category.is_active });
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        editing ? form.put(update.url(editing.id), { onSuccess: () => setEditing(null) }) : form.post(store.url());
    };

    return (
        <>
            <Head title="Kategori" />
            <div className="grid gap-4 p-4 md:grid-cols-[22rem_1fr] md:p-6">
                <Card>
                    <CardContent className="pt-6">
                        <form className="grid gap-3" onSubmit={submit}>
                            <h1 className="text-xl font-semibold">{editing ? 'Ubah Kategori' : 'Tambah Kategori'}</h1>
                            <Input placeholder="Nama kategori" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />
                            <Select value={form.data.type} onValueChange={(value) => form.setData('type', value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="income">Pemasukan</SelectItem>
                                    <SelectItem value="expense">Pengeluaran</SelectItem>
                                    <SelectItem value="debt">Utang</SelectItem>
                                    <SelectItem value="receivable">Piutang</SelectItem>
                                </SelectContent>
                            </Select>
                            {form.data.type === 'expense' && (
                                <Input type="number" placeholder="Batas budget" value={form.data.budget_limit} onChange={(event) => form.setData('budget_limit', event.target.value)} />
                            )}
                            <Button>Simpan</Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Budget</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell>{category.name}</TableCell>
                                        <TableCell>{category.type}</TableCell>
                                        <TableCell>{category.budget_limit ?? '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => edit(category)}>
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sr-only">Ubah</span>
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => router.delete(destroy.url(category.id))}>
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

CategoriesIndex.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
