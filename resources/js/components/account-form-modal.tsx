import { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import {
    store,
    update,
} from "@/actions/App/Http/Controllers/AccountController";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
type Account = {
    id: number;
    name: string;
    account_type?: { name: string } | null;
    is_active: boolean;
};
export function AccountFormModal({
    isOpen,
    onClose,
    account,
}: {
    isOpen: boolean;
    onClose: () => void;
    account?: Account | null;
}) {
    const form = useForm({
        name: "",
        account_type: "",
        is_active: true,
        opening_balance: "",
    });
    useEffect(() => {
        if (isOpen)
            form.setData(
                account
                    ? {
                          name: account.name,
                          account_type: account.account_type?.name ?? "",
                          is_active: account.is_active,
                          opening_balance: "",
                      }
                    : {
                          name: "",
                          account_type: "",
                          is_active: true,
                          opening_balance: "",
                      },
            );
    }, [isOpen, account]);
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        account
                            ? form.put(update.url(account.id), {
                                  onSuccess: onClose,
                              })
                            : form.post(store.url(), { onSuccess: onClose });
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {account ? "Ubah Akun" : "Tambah Akun"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-4">
                        <Label>Nama</Label>
                        <Input
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData("name", event.target.value)
                            }
                        />
                        <Label>Tipe Akun (label bebas)</Label>
                        <Input
                            value={form.data.account_type}
                            onChange={(event) =>
                                form.setData("account_type", event.target.value)
                            }
                        />
                        {!account && (
                            <>
                                <Label>Saldo Awal</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.data.opening_balance}
                                    onChange={(event) =>
                                        form.setData(
                                            "opening_balance",
                                            event.target.value,
                                        )
                                    }
                                />
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Batal
                        </Button>
                        <Button>Simpan</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
