import { useForm } from '@inertiajs/react';
import { update } from '@/actions/App/Http/Controllers/BudgetController';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
export function BudgetFormModal({ isOpen, onClose, category }: { isOpen: boolean; onClose: () => void; category: { id: number; name: string; budget_limit: string | null } }) { const form = useForm({ budget_limit: category.budget_limit ?? '' }); return <Dialog open={isOpen} onOpenChange={onClose}><DialogContent><form onSubmit={(event) => { event.preventDefault(); form.patch(update.url(category.id), { onSuccess: onClose }); }}><DialogHeader><DialogTitle>Budget {category.name}</DialogTitle></DialogHeader><Input className="my-4" type="number" min="0" value={form.data.budget_limit} onChange={(event) => form.setData('budget_limit', event.target.value)} /><DialogFooter><Button type="button" variant="outline" onClick={onClose}>Batal</Button><Button>Simpan</Button></DialogFooter></form></DialogContent></Dialog>; }
