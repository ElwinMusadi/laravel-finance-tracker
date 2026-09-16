import { useState } from 'react';
import { IconWallet } from '@tabler/icons-react';

import type { AccountBrand } from '@/lib/account-brands';
import { cn } from '@/lib/utils';

export function AccountBrandIcon({
    brand,
    className,
    iconClassName,
}: {
    brand: AccountBrand | null;
    className?: string;
    iconClassName?: string;
}) {
    const [hasImageError, setHasImageError] = useState(false);
    const logoUrl = brand?.logoUrl;
    const shouldShowLogo = Boolean(logoUrl) && !hasImageError;

    return (
        <div
            className={cn(
                'flex items-center justify-center overflow-hidden',
                !shouldShowLogo && 'bg-primary/10 text-primary',
                className,
            )}
        >
            {shouldShowLogo ? (
                <img
                    src={logoUrl!}
                    alt=""
                    aria-hidden="true"
                    className={cn('object-contain', iconClassName)}
                    loading="lazy"
                    onError={() => setHasImageError(true)}
                />
            ) : (
                <IconWallet
                    aria-hidden="true"
                    className={cn('text-primary', iconClassName)}
                />
            )}
        </div>
    );
}
