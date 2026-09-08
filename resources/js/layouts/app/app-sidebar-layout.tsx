import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';
import { TransactionFormModal } from '@/components/transaction-form-modal';
import { useTransactionModal } from '@/hooks/use-transaction-modal';
import { usePage } from '@inertiajs/react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { isOpen, closeModal, transaction } = useTransactionModal();
    const { accounts, categories, contacts } = usePage<any>().props;

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="min-w-0 overflow-x-clip">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
            
            <TransactionFormModal 
                isOpen={isOpen}
                onClose={closeModal}
                transaction={transaction}
                accounts={accounts || []}
                categories={categories || []}
                contacts={contacts || []}
            />
        </AppShell>
    );
}
