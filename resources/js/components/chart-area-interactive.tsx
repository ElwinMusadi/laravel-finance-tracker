"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    type ChartConfig,
} from "@/components/ui/chart";

export type CashFlowItem = {
    month: string;
    income: number;
    expense: number;
};

const chartConfig = {
    income: {
        label: "Pemasukan",
        color: "var(--primary, #10b981)",
    },
    expense: {
        label: "Pengeluaran",
        color: "#f43f5e",
    },
} satisfies ChartConfig;

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(val);
};

export function ChartAreaInteractive({ data = [] }: { data: CashFlowItem[] }) {
    const hasData = data.some((item) => item.income > 0 || item.expense > 0);

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-col gap-1 border-b py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="text-base font-semibold">
                        Arus Kas 6 Bulan Terakhir
                    </CardTitle>
                    <CardDescription>
                        Tren perbandingan pemasukan dan pengeluaran Anda.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="size-2.5 rounded-full bg-emerald-500" />
                        <span className="font-medium text-muted-foreground">
                            Pemasukan
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="size-2.5 rounded-full bg-rose-500" />
                        <span className="font-medium text-muted-foreground">
                            Pengeluaran
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                {!hasData ? (
                    <div className="flex h-[240px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
                        <p>
                            Belum ada aktivitas arus kas dalam 6 bulan terakhir.
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                            Transaksi pemasukan dan pengeluaran akan otomatis
                            muncul di grafik ini.
                        </p>
                    </div>
                ) : (
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-auto h-[240px] w-full"
                    >
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient
                                    id="fillIncome"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#10b981"
                                        stopOpacity={0.4}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#10b981"
                                        stopOpacity={0.0}
                                    />
                                </linearGradient>
                                <linearGradient
                                    id="fillExpense"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#f43f5e"
                                        stopOpacity={0.4}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#f43f5e"
                                        stopOpacity={0.0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                opacity={0.3}
                            />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                fontSize={12}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                fontSize={11}
                                tickFormatter={(val) => {
                                    if (val >= 1000000)
                                        return `${(val / 1000000).toFixed(1)}M`;
                                    if (val >= 1000)
                                        return `${(val / 1000).toFixed(0)}k`;
                                    return `${val}`;
                                }}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={({ active, payload }) => {
                                    if (!active || !payload || !payload.length)
                                        return null;
                                    const item = payload[0]
                                        .payload as CashFlowItem;
                                    return (
                                        <div className="rounded-lg border bg-background p-2.5 shadow-md text-xs">
                                            <div className="font-semibold text-foreground mb-1.5">
                                                {item.month}
                                            </div>
                                            <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400">
                                                <span>Pemasukan:</span>
                                                <span className="font-mono font-medium">
                                                    {formatCurrency(
                                                        item.income,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4 text-rose-600 dark:text-rose-400 mt-1">
                                                <span>Pengeluaran:</span>
                                                <span className="font-mono font-medium">
                                                    {formatCurrency(
                                                        item.expense,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                            <Area
                                dataKey="income"
                                type="monotone"
                                fill="url(#fillIncome)"
                                fillOpacity={1}
                                stroke="#10b981"
                                strokeWidth={2}
                                name="Pemasukan"
                            />
                            <Area
                                dataKey="expense"
                                type="monotone"
                                fill="url(#fillExpense)"
                                fillOpacity={1}
                                stroke="#f43f5e"
                                strokeWidth={2}
                                name="Pengeluaran"
                            />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
