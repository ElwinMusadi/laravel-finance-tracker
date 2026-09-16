import { useEffect, useState, type FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { IconChevronDown } from '@tabler/icons-react';

import {
    store,
    update,
} from '@/actions/App/Http/Controllers/TransactionController';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from '@/components/ui/input-group';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Account = { id: number; name: string };
type Contact = { id: number; name: string };
type Category = { id: number; name: string; type: string };
type Transaction = {
    id: number;
    transaction_date: string;
    amount: string;
    description: string;
    category_id: number;
    account_id: number;
    transfer_account_id: number | null;
    contact_id: number | null;
    action: string | null;
    notes: string | null;
};

type TransactionFormData = {
    transaction_date: string;
    amount: string;
    description: string;
    category_id: number | '';
    account_id: number | '';
    transfer_account_id: number | '';
    contact_id: number | '';
    action: string;
    notes: string;
};

const emptyTransactionForm: TransactionFormData = {
    transaction_date: '',
    amount: '',
    description: '',
    category_id: '',
    account_id: '',
    transfer_account_id: '',
    contact_id: '',
    action: '',
    notes: '',
};

function toDateValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function toTimeValue(date: Date): string {
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${hour}:${minute}`;
}

function toLocalDateTimeValue(date: Date): string {
    return `${toDateValue(date)}T${toTimeValue(date)}`;
}

function parseTransactionDate(value: string): Date | undefined {
    const [date] = value.split('T');
    const [year, month, day] = date.split('-').map(Number);

    if (!year || !month || !day) {
        return undefined;
    }

    return new Date(year, month - 1, day);
}

function updateDate(value: string, date: Date): string {
    const time = value.split('T')[1] ?? '00:00';

    return `${toDateValue(date)}T${time}`;
}

export function TransactionFormModal({
    isOpen,
    onClose,
    transaction,
    accounts,
    categories,
    contacts,
}: {
    isOpen: boolean;
    onClose: () => void;
    transaction?: Transaction | null;
    accounts: Account[];
    categories: Category[];
    contacts: Contact[];
}) {
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const form = useForm<TransactionFormData>(emptyTransactionForm);
    const category = categories.find(
        (item) => item.id === form.data.category_id,
    );
    const needsContact =
        category?.type === 'debt' || category?.type === 'receivable';
    const isTransfer = category?.type === 'transfer';
    const selectedDate = parseTransactionDate(form.data.transaction_date);
    const selectedTime = form.data.transaction_date.split('T')[1] ?? '';

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const currentDate = transaction
            ? new Date(transaction.transaction_date)
            : new Date();

        form.setData(
            transaction
                ? {
                      transaction_date: toLocalDateTimeValue(currentDate),
                      amount: transaction.amount,
                      description: transaction.description,
                      category_id: transaction.category_id,
                      account_id: transaction.account_id,
                      transfer_account_id:
                          transaction.transfer_account_id ?? '',
                      contact_id: transaction.contact_id ?? '',
                      action: transaction.action ?? '',
                      notes: transaction.notes ?? '',
                  }
                : {
                      ...emptyTransactionForm,
                      transaction_date: toLocalDateTimeValue(currentDate),
                  },
        );
        form.clearErrors();
    }, [isOpen, transaction]);

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (transaction) {
            form.put(update.url(transaction.id), { onSuccess: onClose });

            return;
        }

        form.post(store.url(), { onSuccess: onClose });
    };

    const renderOptions = (items: Account[] | Contact[] | Category[]) => (
        <SelectGroup>
            {items.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                    {item.name}
                </SelectItem>
            ))}
        </SelectGroup>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>
                            {transaction ? 'Ubah Transaksi' : 'Catat Transaksi'}
                        </DialogTitle>
                    </DialogHeader>

                    <FieldGroup className="py-4">
                        <Field data-invalid={Boolean(form.errors.description)}>
                            <FieldLabel htmlFor="transaction-description">
                                Deskripsi
                            </FieldLabel>
                            <Input
                                id="transaction-description"
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                                aria-invalid={Boolean(form.errors.description)}
                            />
                            <FieldError>{form.errors.description}</FieldError>
                        </Field>

                        <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field
                                data-invalid={Boolean(form.errors.category_id)}
                            >
                                <FieldLabel>Kategori</FieldLabel>
                                <Select
                                    value={String(form.data.category_id)}
                                    onValueChange={(value) =>
                                        form.setData(
                                            'category_id',
                                            Number(value),
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        className="w-full"
                                        aria-invalid={Boolean(
                                            form.errors.category_id,
                                        )}
                                    >
                                        <SelectValue placeholder="Pilih kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {renderOptions(categories)}
                                    </SelectContent>
                                </Select>
                                <FieldError>
                                    {form.errors.category_id}
                                </FieldError>
                            </Field>

                            <Field
                                data-invalid={Boolean(form.errors.account_id)}
                            >
                                <FieldLabel>Akun</FieldLabel>
                                <Select
                                    value={String(form.data.account_id)}
                                    onValueChange={(value) =>
                                        form.setData(
                                            'account_id',
                                            Number(value),
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        className="w-full"
                                        aria-invalid={Boolean(
                                            form.errors.account_id,
                                        )}
                                    >
                                        <SelectValue placeholder="Pilih akun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {renderOptions(accounts)}
                                    </SelectContent>
                                </Select>
                                <FieldError>
                                    {form.errors.account_id}
                                </FieldError>
                            </Field>
                        </FieldGroup>

                        {isTransfer && (
                            <Field
                                data-invalid={Boolean(
                                    form.errors.transfer_account_id,
                                )}
                            >
                                <FieldLabel>Akun Tujuan</FieldLabel>
                                <Select
                                    value={String(
                                        form.data.transfer_account_id,
                                    )}
                                    onValueChange={(value) =>
                                        form.setData(
                                            'transfer_account_id',
                                            Number(value),
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        className="w-full"
                                        aria-invalid={Boolean(
                                            form.errors.transfer_account_id,
                                        )}
                                    >
                                        <SelectValue placeholder="Pilih akun tujuan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {renderOptions(accounts)}
                                    </SelectContent>
                                </Select>
                                <FieldError>
                                    {form.errors.transfer_account_id}
                                </FieldError>
                            </Field>
                        )}

                        {needsContact && (
                            <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field
                                    data-invalid={Boolean(
                                        form.errors.contact_id,
                                    )}
                                >
                                    <FieldLabel>Kontak</FieldLabel>
                                    <Select
                                        value={String(form.data.contact_id)}
                                        onValueChange={(value) =>
                                            form.setData(
                                                'contact_id',
                                                Number(value),
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            className="w-full"
                                            aria-invalid={Boolean(
                                                form.errors.contact_id,
                                            )}
                                        >
                                            <SelectValue placeholder="Pilih kontak" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {renderOptions(contacts)}
                                        </SelectContent>
                                    </Select>
                                    <FieldError>
                                        {form.errors.contact_id}
                                    </FieldError>
                                </Field>

                                <Field
                                    data-invalid={Boolean(form.errors.action)}
                                >
                                    <FieldLabel>Aksi</FieldLabel>
                                    <Select
                                        value={form.data.action}
                                        onValueChange={(value) =>
                                            form.setData('action', value)
                                        }
                                    >
                                        <SelectTrigger
                                            className="w-full"
                                            aria-invalid={Boolean(
                                                form.errors.action,
                                            )}
                                        >
                                            <SelectValue placeholder="Pilih aksi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {(category?.type === 'debt'
                                                    ? [
                                                          [
                                                              'receive_loan',
                                                              'Menerima pinjaman',
                                                          ],
                                                          [
                                                              'repay_debt',
                                                              'Membayar utang',
                                                          ],
                                                      ]
                                                    : [
                                                          [
                                                              'give_loan',
                                                              'Memberi pinjaman',
                                                          ],
                                                          [
                                                              'receive_repayment',
                                                              'Menerima pelunasan',
                                                          ],
                                                      ]
                                                ).map(([value, label]) => (
                                                    <SelectItem
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <FieldError>
                                        {form.errors.action}
                                    </FieldError>
                                </Field>
                            </FieldGroup>
                        )}

                        <Field data-invalid={Boolean(form.errors.amount)}>
                            <FieldLabel htmlFor="transaction-amount">
                                Jumlah
                            </FieldLabel>
                            <InputGroup>
                                <InputGroupAddon>
                                    <InputGroupText>Rp</InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="transaction-amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={form.data.amount}
                                    onChange={(event) =>
                                        form.setData(
                                            'amount',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(form.errors.amount)}
                                />
                            </InputGroup>
                            <FieldError>{form.errors.amount}</FieldError>
                        </Field>

                        <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field
                                data-invalid={Boolean(
                                    form.errors.transaction_date,
                                )}
                            >
                                <FieldLabel htmlFor="transaction-date">
                                    Tanggal
                                </FieldLabel>
                                <Popover
                                    open={isDatePickerOpen}
                                    onOpenChange={setIsDatePickerOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="transaction-date"
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-between font-normal"
                                            aria-invalid={Boolean(
                                                form.errors.transaction_date,
                                            )}
                                        >
                                            {selectedDate
                                                ? format(
                                                      selectedDate,
                                                      'd MMMM yyyy',
                                                      { locale: id },
                                                  )
                                                : 'Pilih tanggal'}
                                            <IconChevronDown data-icon="inline-end" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto overflow-hidden p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            captionLayout="dropdown"
                                            defaultMonth={selectedDate}
                                            locale={id}
                                            onSelect={(date) => {
                                                if (!date) {
                                                    return;
                                                }

                                                form.setData(
                                                    'transaction_date',
                                                    updateDate(
                                                        form.data
                                                            .transaction_date,
                                                        date,
                                                    ),
                                                );
                                                setIsDatePickerOpen(false);
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FieldError>
                                    {form.errors.transaction_date}
                                </FieldError>
                            </Field>

                            <Field
                                data-invalid={Boolean(
                                    form.errors.transaction_date,
                                )}
                            >
                                <FieldLabel htmlFor="transaction-time">
                                    Waktu
                                </FieldLabel>
                                <Input
                                    id="transaction-time"
                                    type="time"
                                    step="60"
                                    value={selectedTime}
                                    onChange={(event) => {
                                        const date =
                                            form.data.transaction_date.split(
                                                'T',
                                            )[0] || toDateValue(new Date());

                                        form.setData(
                                            'transaction_date',
                                            `${date}T${event.target.value}`,
                                        );
                                    }}
                                    aria-invalid={Boolean(
                                        form.errors.transaction_date,
                                    )}
                                />
                                <FieldError>
                                    {form.errors.transaction_date}
                                </FieldError>
                            </Field>
                        </FieldGroup>
                    </FieldGroup>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Batal
                        </Button>
                        <Button disabled={form.processing}>Simpan</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
