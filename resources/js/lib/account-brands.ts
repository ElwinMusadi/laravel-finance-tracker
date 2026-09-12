export type AccountBrand = {
    name: string;
    accentColor: string;
    logoUrl: string;
};

type AccountBrandDefinition = AccountBrand & {
    aliases: string[];
};

const accountBrands: AccountBrandDefinition[] = [
    {
        name: 'Bank Jago',
        aliases: ['bank jago'],
        accentColor: '#F7C600',
        logoUrl: '/images/account-brands/bank-jago.webp',
    },
    {
        name: 'GoPay',
        aliases: ['gopay', 'go pay'],
        accentColor: '#00AED6',
        logoUrl: '/images/account-brands/gopay.webp',
    },
];

function normalizeAccountName(name: string): string {
    return name
        .normalize('NFKD')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

export function resolveAccountBrand(name: string): AccountBrand | null {
    const normalizedName = normalizeAccountName(name);
    const brand = accountBrands.find(({ aliases }) =>
        aliases.some(
            (alias) =>
                normalizedName === alias ||
                normalizedName.startsWith(`${alias} `),
        ),
    );

    if (!brand) {
        return null;
    }

    return {
        name: brand.name,
        accentColor: brand.accentColor,
        logoUrl: brand.logoUrl,
    };
}
