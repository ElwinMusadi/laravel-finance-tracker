import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

import { store, update } from '@/actions/App/Http/Controllers/ContactController';

interface Contact {
    id: number;
    name: string;
    is_active: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    contact?: Contact | null;
}

export function ContactFormModal({ isOpen, onClose, contact }: Props) {
    const isEditing = !!contact;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        is_active: true,
    });

    useEffect(() => {
        if (isOpen) {
            if (contact) {
                setData({
                    name: contact.name,
                    is_active: contact.is_active,
                });
            } else {
                reset();
            }
            clearErrors();
        }
    }, [isOpen, contact]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            put(update.url(contact.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(store.url(), {
                onSuccess: () => onClose(),
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
                        <DialogDescription>
                            {isEditing 
                                ? 'Update the details for this contact.' 
                                : 'Create a new contact for debt or receivable tracking.'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. John Doe, Bank Loans Inc."
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-2">
                            <Checkbox 
                                id="is_active" 
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                            />
                            <Label htmlFor="is_active" className="font-normal cursor-pointer">
                                Active (can be used for new accounts)
                            </Label>
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
