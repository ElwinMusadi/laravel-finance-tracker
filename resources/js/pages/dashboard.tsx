import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    CardContent,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
    IconTrendingUp,
    IconTrendingDown,
    IconWallet,
    IconReceipt,
    IconChartPie,
    IconArrowUpRight,
    IconArrowDownLeft,
    IconArrowsExchange,
    IconPlus,
} from '@tabler/icons-react';
import {
    ChartAreaInteractive,
    type CashFlowItem,
} from '@/components/chart-area-interactive';
import { useTransactionModal } from '@/hooks/use-transaction-modal';
import { Button } from '@/components/ui/button';

interface Metrics {
    totalAccounts?: string;
    totalReceivables?: string;
    totalDebts?: string;
    totalAssets: string;
    totalLiabilities: string;
    netWorth: string;
    monthlyIncome: string;
    monthlyExpense: string;
    totalBudget: string;
    budgetUsedPercentage: number;
}

interface Transaction {
    id: number;
    transaction_date: string;
    amount: string;
    description: string;
    action?: string | null;
    account?: { id: number; name: string };
    transfer_account?: { id: number; name: string };
    category?: { id: number; name: string; type: string };
    contact?: { id: number; name: string };
}

interface Props {
    metrics: Metrics;
    cashFlowTrend?: CashFlowItem[];
    cashFlowCurrentMonth?: CashFlowItem[];
    recentTransactions: Transaction[];
    currentMonth: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({
    metrics,
    cashFlowTrend = [],
    cashFlowCurrentMonth = [],
    recentTransactions = [],
    currentMonth,
}: Props) {
    const { openModal } = useTransactionModal();

    const formatCurrency = (amount: string | number | undefined) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Number(amount ?? 0));
    };

    const formatDate = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const netWorthNum = Number(metrics.netWorth);
    const budgetPercentage = Math.min(
        Math.max(metrics.budgetUsedPercentage, 0),
        100,
    );

    return (
        <>
            <Head title="Dashboard" />

            <div className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Title & Action */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Ringkasan Keuangan
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Pemantauan arus kas, saldo, dan anggaran periode{' '}
                            {currentMonth}.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={openModal} className="shadow-xs">
                            <IconPlus className="mr-1.5 size-4" />
                            Catat Transaksi
                        </Button>
                    </div>
                </div>

                {/* Top KPI Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Net Worth */}
                    <Card className="border-border/60 shadow-xs transition-shadow hover:shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                    Kekayaan Bersih
                                </CardDescription>
                                <Badge
                                    variant="outline"
                                    className={
                                        netWorthNum >= 0
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400'
                                            : 'border-rose-500/30 bg-rose-500/10 text-[11px] text-rose-600 dark:text-rose-400'
                                    }
                                >
                                    {netWorthNum >= 0 ? (
                                        <IconTrendingUp className="mr-0.5 size-2" />
                                    ) : (
                                        <IconTrendingDown className="mr-0.5 size-2" />
                                    )}
                                    {netWorthNum >= 0 ? 'Surplus' : 'Defisit'}
                                </Badge>
                            </div>
                            <CardTitle className="text-2xl font-bold tabular-nums">
                                {formatCurrency(metrics.netWorth)}
                            </CardTitle>
                        </CardHeader>
                        <CardFooter className="text-muted-foreground pt-0 text-xs">
                            Total aset dikurangi seluruh liabilitas utang.
                        </CardFooter>
                    </Card>

                    {/* Liquid Assets / Saldo Akun */}
                    <Card className="border-border/60 shadow-xs transition-shadow hover:shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                    Total Saldo Akun
                                </CardDescription>
                                <div className="bg-primary/10 text-primary rounded-md p-1.5">
                                    <IconWallet className="size-4" />
                                </div>
                            </div>
                            <CardTitle className="text-foreground text-2xl font-bold tabular-nums">
                                {formatCurrency(metrics.totalAssets)}
                            </CardTitle>
                        </CardHeader>
                        <CardFooter className="text-muted-foreground flex justify-between pt-0 text-xs">
                            <span>Liabilitas / Utang:</span>
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                                {formatCurrency(metrics.totalLiabilities)}
                            </span>
                        </CardFooter>
                    </Card>

                    {/* Monthly Income */}
                    <Card className="border-border/60 shadow-xs transition-shadow hover:shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                    Pemasukan Bulan Ini
                                </CardDescription>
                                <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400">
                                    <IconArrowDownLeft className="size-4" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                                +{formatCurrency(metrics.monthlyIncome)}
                            </CardTitle>
                        </CardHeader>
                        <CardFooter className="text-muted-foreground pt-0 text-xs">
                            Total pendapatan yang diterima bulan ini.
                        </CardFooter>
                    </Card>

                    {/* Monthly Expense & Budget */}
                    <Card className="border-border/60 shadow-xs transition-shadow hover:shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                    Pengeluaran Bulan Ini
                                </CardDescription>
                                <div className="rounded-md bg-rose-500/10 p-1.5 text-rose-600 dark:text-rose-400">
                                    <IconArrowUpRight className="size-4" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold text-rose-600 tabular-nums dark:text-rose-400">
                                -{formatCurrency(metrics.monthlyExpense)}
                            </CardTitle>
                        </CardHeader>
                        <CardFooter className="flex flex-col items-stretch gap-1.5 pt-0 text-xs">
                            <div className="text-muted-foreground flex justify-between">
                                <span>
                                    Budget:{' '}
                                    {formatCurrency(metrics.totalBudget)}
                                </span>
                                <span
                                    className={
                                        budgetPercentage >= 90
                                            ? 'font-bold text-rose-600'
                                            : ''
                                    }
                                >
                                    {budgetPercentage}%
                                </span>
                            </div>
                            <Progress
                                value={budgetPercentage}
                                className={`h-1.5 ${budgetPercentage >= 90 ? '[&>div]:bg-rose-500' : '[&>div]:bg-primary'}`}
                            />
                        </CardFooter>
                    </Card>
                </div>

                {/* Recent Transactions & Quick Actions */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    {/* Cash Flow Chart */}
                    <div className="lg:col-span-5">
                        <ChartAreaInteractive
                            data={cashFlowTrend}
                            currentMonthData={cashFlowCurrentMonth}
                        />
                    </div>

                    {/* Recent Transactions List */}
                    <Card className="border-border/60 overflow-hidden shadow-xs lg:col-span-7">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Transaksi Terbaru
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Aktivitas mutasi dana terakhir yang tercatat
                                    di sistem.
                                </CardDescription>
                            </div>
                            <Link
                                href="/transactions"
                                className="text-primary text-xs font-medium hover:underline"
                            >
                                Lihat Semua →
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-32">
                                            Tanggal
                                        </TableHead>
                                        <TableHead>
                                            Deskripsi & Kategori
                                        </TableHead>
                                        <TableHead className="w-40">
                                            Akun
                                        </TableHead>
                                        <TableHead className="w-36 text-right">
                                            Nominal
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentTransactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="text-muted-foreground h-28 text-center text-sm"
                                            >
                                                Belum ada catatan transaksi.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentTransactions.map((t) => {
                                            const isExpense =
                                                t.category?.type === 'expense';
                                            const isIncome =
                                                t.category?.type === 'income';
                                            const isTransfer =
                                                t.category?.type === 'transfer';

                                            return (
                                                <TableRow
                                                    key={t.id}
                                                    className="text-xs sm:text-sm"
                                                >
                                                    <TableCell className="text-muted-foreground font-medium whitespace-nowrap">
                                                        {formatDate(
                                                            t.transaction_date,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-foreground font-medium">
                                                                {t.description ||
                                                                    'Tanpa deskripsi'}
                                                            </span>
                                                            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                                                {t.category && (
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="px-1.5 py-0 text-[10px] font-normal"
                                                                    >
                                                                        {
                                                                            t
                                                                                .category
                                                                                .name
                                                                        }
                                                                    </Badge>
                                                                )}
                                                                {t.contact && (
                                                                    <span className="text-muted-foreground text-[11px]">
                                                                        •{' '}
                                                                        {
                                                                            t
                                                                                .contact
                                                                                .name
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <span className="text-foreground font-medium">
                                                                {t.account
                                                                    ?.name ??
                                                                    '-'}
                                                            </span>
                                                            {isTransfer &&
                                                                t.transfer_account && (
                                                                    <>
                                                                        <IconArrowsExchange className="text-muted-foreground size-3" />
                                                                        <span className="text-foreground font-medium">
                                                                            {
                                                                                t
                                                                                    .transfer_account
                                                                                    .name
                                                                            }
                                                                        </span>
                                                                    </>
                                                                )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-medium tabular-nums">
                                                        <span
                                                            className={
                                                                isIncome
                                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                                    : isExpense
                                                                      ? 'text-rose-600 dark:text-rose-400'
                                                                      : isTransfer
                                                                        ? 'text-blue-600 dark:text-blue-400'
                                                                        : 'text-foreground'
                                                            }
                                                        >
                                                            {isIncome
                                                                ? '+'
                                                                : isExpense
                                                                  ? '-'
                                                                  : ''}
                                                            {formatCurrency(
                                                                t.amount,
                                                            )}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Quick Actions & Navigation */}
                    {/* <Card className="border-border/60 shadow-xs h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Akses Cepat
              </CardTitle>
              <CardDescription className="text-xs">
                Pintasan navigasi dan tindakan harian.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2.5">
              <button
                type="button"
                onClick={openModal}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors text-left group"
              >
                <div className="bg-primary/10 p-2 rounded-md group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <IconReceipt className="h-4 w-4 text-primary group-hover:text-primary-foreground" />
                </div>
                <div>
                  <div className="font-medium text-sm">
                    Catat Transaksi Baru
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Pemasukan, belanja, atau transfer
                  </div>
                </div>
              </button>

              <Link
                href="/accounts"
                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors text-left group"
              >
                <div className="bg-primary/10 p-2 rounded-md group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <IconWallet className="h-4 w-4 text-primary group-hover:text-primary-foreground" />
                </div>
                <div>
                  <div className="font-medium text-sm">Kelola Akun & Saldo</div>
                  <div className="text-xs text-muted-foreground">
                    Bank, dompet digital, dan kas
                  </div>
                </div>
              </Link>

              <Link
                href="/budgets"
                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors text-left group"
              >
                <div className="bg-primary/10 p-2 rounded-md group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <IconChartPie className="h-4 w-4 text-primary group-hover:text-primary-foreground" />
                </div>
                <div>
                  <div className="font-medium text-sm">
                    Kontrol Anggaran Bulanan
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Pantau batas belanja per kategori
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card> */}
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
