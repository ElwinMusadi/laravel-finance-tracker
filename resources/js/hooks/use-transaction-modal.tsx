import { useSyncExternalStore } from 'react';

type TransactionModalState = {
    isOpen: boolean;
    transaction?: any | null;
};

let currentState: TransactionModalState = { isOpen: false };
const listeners = new Set<() => void>();

const subscribe = (callback: () => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
};

const notify = () => listeners.forEach((listener) => listener());

export function useTransactionModal() {
    const state = useSyncExternalStore(subscribe, () => currentState, () => currentState);

    const openModal = () => {
        currentState = { isOpen: true, transaction: null };
        notify();
    };

    const openEditModal = (transaction: any) => {
        currentState = { isOpen: true, transaction };
        notify();
    };

    const closeModal = () => {
        currentState = { isOpen: false, transaction: null };
        notify();
    };

    return { ...state, openModal, openEditModal, closeModal };
}
