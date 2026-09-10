import type { ReactNode } from "react";
import type { BreadcrumbItem } from "@/types/navigation";

export type AppLayoutProps = {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

export type AppVariant = "header" | "sidebar";

export type FlashMessages = {
    success?: string | null;
    error?: string | null;
    warning?: string | null;
    info?: string | null;
};

export type FlashToast = {
    type: "success" | "info" | "warning" | "error";
    message: string;
};

export type AuthLayoutProps = {
    children?: ReactNode;
    name?: string;
    title?: string;
    description?: string;
};
