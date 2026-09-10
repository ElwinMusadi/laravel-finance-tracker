import { useForm } from "@inertiajs/react";
import { update } from "@/actions/App/Http/Controllers/BudgetController";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BudgetFormModal({
    isOpen,
    onClose,
    category,
}: {
    isOpen: boolean;
    onClose: () => void;
    category: { id: number; name: string; budget_limit: string | null };
}) {
    const form = useForm({
        budget_limit: category.budget_limit ?? "",
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        form.patch(update.url(category.id), {
            onSuccess: onClose,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Atur Batas Budget</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground pt-1">
                            Tentukan batas maksimal pengeluaran bulanan untuk
                            kategori <strong>{category.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-4">
                        <Label htmlFor="budget_limit" className="text-xs">
                            Batas Anggaran Bulanan (Rp)
                        </Label>
                        <Input
                            id="budget_limit"
                            type="number"
                            min="0"
                            step="1000"
                            placeholder="Contoh: 1500000"
                            value={form.data.budget_limit}
                            onChange={(event) =>
                                form.setData("budget_limit", event.target.value)
                            }
                            className="text-base font-mono"
                            autoFocus
                        />
                        {form.errors.budget_limit && (
                            <p className="text-xs text-destructive">
                                {form.errors.budget_limit}
                            </p>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? "Menyimpan..." : "Simpan Budget"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
