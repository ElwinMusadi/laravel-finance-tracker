import { usePage } from "@inertiajs/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { FlashMessages } from "@/types/ui";

export function useFlashToast(): void {
    const { flash } = usePage<{ flash?: FlashMessages }>().props;
    const lastFlash = useRef<string | null>(null);

    useEffect(() => {
        if (!flash) {
            return;
        }

        if (flash.success && lastFlash.current !== `success:${flash.success}`) {
            toast.success(flash.success);
            lastFlash.current = `success:${flash.success}`;
        } else if (
            flash.error &&
            lastFlash.current !== `error:${flash.error}`
        ) {
            toast.error(flash.error);
            lastFlash.current = `error:${flash.error}`;
        } else if (
            flash.warning &&
            lastFlash.current !== `warning:${flash.warning}`
        ) {
            toast.warning(flash.warning);
            lastFlash.current = `warning:${flash.warning}`;
        } else if (flash.info && lastFlash.current !== `info:${flash.info}`) {
            toast.info(flash.info);
            lastFlash.current = `info:${flash.info}`;
        }
    }, [flash]);
}
