import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { store, update } from '@/actions/App/Http/Controllers/AccountController';

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
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    account?: Account | null;
    contacts: Contact[];
}

export function AccountFormModal({ isOpen, onClose, account, contacts }: Props) {
    const isEditing = !!account;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        type: 'asset',
        contact_id: null as number | null,
        is_active: true,
        opening_balance: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (account) {
                setData({
                    name: account.name,
                    type: account.type,
                    contact_id: account.contact_id,
                    is_active: account.is_active,
                    opening_balance: '', // Cannot edit opening balance via account update
                });
            } else {
                reset();
            }
            clearErrors();
        }
    }, [isOpen, account]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            put(update.url(account.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(store.url(), {
                onSuccess: () => onClose(),
            });
        }
    };

    const needsContact = ['asset', 'liability'].includes(data.type);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Ubah Akun' : 'Tambah Akun'}</DialogTitle>
                        <DialogDescription>
                            {isEditing 
                                ? 'Perbarui detail untuk akun ini.'
                                : 'Buat akun baru. Untuk aset, Anda dapat menambahkan saldo awal.'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="cth. Bank BCA, Belanja, Gaji"
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="type">Tipe Akun</Label>
                            <Select 
                                value={data.type} 
                                onValueChange={(val) => {
                                    setData('type', val as any);
                                    if (!['asset', 'liability'].includes(val)) {
                                        setData('contact_id', null);
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="asset">Aset (Kas, Bank, E-Wallet, Piutang)</SelectItem>
                                    <SelectItem value="liability">Liabilitas (Hutang, Kartu Kredit)</SelectItem>
                                    <SelectItem value="revenue">Pendapatan (Kategori pemasukan)</SelectItem>
                                    <SelectItem value="expense">Beban (Kategori pengeluaran)</SelectItem>
                                    <SelectItem value="equity">Ekuitas (Sistem/Saldo Awal)</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                        </div>

                        {needsContact && (
                            <div className="grid gap-2">
                                <Label htmlFor="contact_id">Tautkan ke Kontak (Opsional)</Label>
                                <Select 
                                    value={data.contact_id ? String(data.contact_id) : 'none'} 
                                    onValueChange={(val) => setData('contact_id', val === 'none' ? null : Number(val))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tanpa kontak" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Tanpa Kontak --</SelectItem>
                                        {contacts.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Tautkan ke kontak jika akun ini mewakili hutang (liabilitas) atau pinjaman yang diberikan (aset piutang).
                                </p>
                                {errors.contact_id && <p className="text-sm text-destructive">{errors.contact_id}</p>}
                            </div>
                        )}

                        {!isEditing && data.type === 'asset' && (
                            <div className="grid gap-2">
                                <Label htmlFor="opening_balance">Saldo Awal (Opsional)</Label>
                                <Input
                                    id="opening_balance"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.opening_balance}
                                    onChange={(e) => setData('opening_balance', e.target.value)}
                                    placeholder="0.00"
                                />
                                {errors.opening_balance && <p className="text-sm text-destructive">{errors.opening_balance}</p>}
                            </div>
                        )}
                        
                        <div className="flex items-center space-x-2 mt-2">
                            <Checkbox 
                                id="is_active" 
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                            />
                            <Label htmlFor="is_active" className="font-normal cursor-pointer">
                                Aktif (dapat digunakan untuk transaksi baru)
                            </Label>
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
