import AppLayout from "@/layouts/app-layout"
import { BreadcrumbItem } from "@/types"
import { Head, Link } from "@inertiajs/react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IconTrendingUp, IconTrendingDown, IconWallet, IconCreditCard, IconReceipt, IconChartPie } from "@tabler/icons-react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"

interface Metrics {
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
    source_account?: { name: string, type: string };
    destination_account?: { name: string, type: string };
}

interface Props {
    metrics: Metrics;
    recentTransactions: Transaction[];
    currentMonth: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dasbor',
        href: '/dashboard',
    },
];

export default function Dashboard({ metrics, recentTransactions, currentMonth }: Props) {
    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Number(amount));
    };

    const formatDate = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <Head title="Dasbor" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 max-w-7xl mx-auto w-full">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Ringkasan</h1>
                    <p className="text-sm text-muted-foreground">
                        Ringkasan keuangan Anda untuk {currentMonth}.
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card md:grid-cols-2 lg:grid-cols-4">
                    {/* Net Worth */}
                    <Card className="@container/card">
                        <CardHeader>
                            <CardDescription>Kekayaan Bersih</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {formatCurrency(metrics.netWorth)}
                            </CardTitle>
                            <CardAction>
                                <Badge variant="outline" className={Number(metrics.netWorth) >= 0 ? "text-emerald-500" : "text-destructive"}>
                                    {Number(metrics.netWorth) >= 0 ? <IconTrendingUp className="mr-1 h-3 w-3" /> : <IconTrendingDown className="mr-1 h-3 w-3" />}
                                    {Number(metrics.netWorth) >= 0 ? "Positive" : "Negative"}
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="text-muted-foreground">Aset dikurangi Liabilitas</div>
                        </CardFooter>
                    </Card>
                    
                    {/* Assets vs Liabilities */}
                    <Card className="@container/card">
                        <CardHeader>
                            <CardDescription>Total Aset</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums text-emerald-600 @[250px]/card:text-3xl">
                                {formatCurrency(metrics.totalAssets)}
                            </CardTitle>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm pt-0">
                            <div className="flex justify-between w-full">
                                <span className="text-muted-foreground">Liabilitas:</span>
                                <span className="font-medium text-destructive">{formatCurrency(metrics.totalLiabilities)}</span>
                            </div>
                        </CardFooter>
                    </Card>

                    {/* Monthly Income */}
                    <Card className="@container/card">
                        <CardHeader>
                            <CardDescription>Pemasukan Bulan Ini</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {formatCurrency(metrics.monthlyIncome)}
                            </CardTitle>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="text-muted-foreground">Revenue generated this month</div>
                        </CardFooter>
                    </Card>

                    {/* Monthly Expense & Budget */}
                    <Card className="@container/card">
                        <CardHeader>
                            <CardDescription>Pengeluaran Bulan Ini</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {formatCurrency(metrics.monthlyExpense)}
                            </CardTitle>
                            <CardAction>
                                <Badge variant="outline" className={metrics.budgetUsedPercentage > 90 ? "border-destructive text-destructive" : ""}>
                                    {metrics.budgetUsedPercentage}% Budget
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm pt-0">
                            <div className="flex justify-between w-full">
                                <span className="text-muted-foreground">Total Budget:</span>
                                <span className="font-medium">{formatCurrency(metrics.totalBudget)}</span>
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                {/* Additional Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                    {/* Recent Transactions */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Transaksi Terbaru</CardTitle>
                            <CardDescription>Your latest financial movements.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Flow</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentTransactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                                Belum ada transaksi.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentTransactions.map(t => (
                                            <TableRow key={t.id}>
                                                <TableCell className="whitespace-nowrap text-sm">
                                                    {formatDate(t.transaction_date)}
                                                </TableCell>
                                                <TableCell className="font-medium">{t.description}</TableCell>
                                                <TableCell>
                                                    <span className="text-xs text-muted-foreground">
                                                        {t.source_account?.name} → {t.destination_account?.name}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-medium">
                                                    {formatCurrency(t.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter className="border-t pt-4">
                            <Link href="/transactions" className="text-sm text-primary hover:underline font-medium w-full text-center">
                                Lihat Semua Transaksi
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* Quick Links / Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Akses Cepat</CardTitle>
                            <CardDescription>Navigasi ke fitur yang sering digunakan.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <Link href="/transactions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors border">
                                <div className="bg-primary/10 p-2 rounded-md">
                                    <IconReceipt className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <div className="font-medium text-sm">Catat Transaksi</div>
                                    <div className="text-xs text-muted-foreground">Tambah pemasukan atau pengeluaran</div>
                                </div>
                            </Link>
                            <Link href="/accounts" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors border">
                                <div className="bg-primary/10 p-2 rounded-md">
                                    <IconWallet className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <div className="font-medium text-sm">Kelola Akun</div>
                                    <div className="text-xs text-muted-foreground">Perbarui saldo atau tambah akun baru</div>
                                </div>
                            </Link>
                            <Link href="/budgets" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors border">
                                <div className="bg-primary/10 p-2 rounded-md">
                                    <IconChartPie className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <div className="font-medium text-sm">Lihat Budget</div>
                                    <div className="text-xs text-muted-foreground">Periksa batas pengeluaran</div>
                                </div>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
