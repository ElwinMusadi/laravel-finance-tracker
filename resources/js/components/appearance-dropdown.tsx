import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { Button } from '@/components/ui/button';

export function AppearanceDropdown() {
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const toggleAppearance = () => {
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
    };

    return (
        <Button variant="ghost" size="icon" className="group h-9 w-9 rounded-full" onClick={toggleAppearance}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 opacity-80 group-hover:opacity-100" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 opacity-80 group-hover:opacity-100" />
            <span className="sr-only">Ubah tema</span>
        </Button>
    );
}
