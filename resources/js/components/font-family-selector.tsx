import { Badge } from '@/components/ui/badge';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
    FieldTitle,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { type FontFamily, useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

type FontOption = {
    value: FontFamily;
    label: string;
    description: string;
    previewClassName: string;
    recommended?: boolean;
};

const fontOptions: FontOption[] = [
    {
        value: 'ibm-plex',
        label: 'IBM Plex Sans',
        description: 'Profesional dan mudah dibaca',
        previewClassName: 'font-preview-ibm-plex',
        recommended: true,
    },
    {
        value: 'inter',
        label: 'Inter',
        description: 'Bersih dan netral',
        previewClassName: 'font-preview-inter',
    },
    {
        value: 'manrope',
        label: 'Manrope',
        description: 'Modern dan ramah',
        previewClassName: 'font-preview-manrope',
    },
];

export default function FontFamilySelector() {
    const { fontFamily, updateFontFamily } = useAppearance();

    return (
        <FieldSet>
            <FieldLegend>Font aplikasi</FieldLegend>
            <FieldDescription>
                Pilih font untuk teks, tabel, dan judul aplikasi.
            </FieldDescription>
            <RadioGroup
                value={fontFamily}
                onValueChange={(value) => {
                    const option = fontOptions.find(
                        (option) => option.value === value,
                    );

                    if (option) {
                        updateFontFamily(option.value);
                    }
                }}
            >
                {fontOptions.map((option) => (
                    <FieldLabel
                        key={option.value}
                        htmlFor={`font-family-${option.value}`}
                        className={cn(
                            'cursor-pointer rounded-xl border p-4 transition-colors',
                            fontFamily === option.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:bg-muted/50',
                        )}
                    >
                        <Field orientation="horizontal" className="gap-4">
                            <RadioGroupItem
                                id={`font-family-${option.value}`}
                                value={option.value}
                            />
                            <FieldContent className="min-w-0 gap-2">
                                <div className="flex items-center gap-2">
                                    <FieldTitle>{option.label}</FieldTitle>
                                    {option.recommended && (
                                        <Badge variant="secondary">
                                            Direkomendasikan
                                        </Badge>
                                    )}
                                </div>
                                <FieldDescription>
                                    {option.description}
                                </FieldDescription>
                                <span
                                    className={cn(
                                        'text-lg font-medium tabular-nums',
                                        option.previewClassName,
                                    )}
                                >
                                    Aa Rp 1.607.500
                                </span>
                            </FieldContent>
                        </Field>
                    </FieldLabel>
                ))}
            </RadioGroup>
        </FieldSet>
    );
}
