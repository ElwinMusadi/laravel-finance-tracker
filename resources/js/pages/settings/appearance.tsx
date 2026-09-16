import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import FontFamilySelector from '@/components/font-family-selector';
import Heading from '@/components/heading';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Pengaturan tampilan" />

            <h1 className="sr-only">Pengaturan tampilan</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Pengaturan tampilan"
                    description="Perbarui pengaturan tampilan untuk akun Anda"
                />
                <div className="flex flex-col gap-6">
                    <AppearanceTabs />
                    <FontFamilySelector />
                </div>
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: editAppearance(),
        },
    ],
};
