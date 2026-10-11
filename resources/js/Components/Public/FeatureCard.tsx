import { AwardIcon, CoffeeIcon, ScissorsIcon, ShieldIcon } from '@/lib/icons';
import type { Feature, FeatureIcon } from '@/lib/content';

/*
|--------------------------------------------------------------------------
| FeatureCard
|--------------------------------------------------------------------------
| The "Почему мы" block. Icons are mapped from a stable identifier so the
| features can come from settings later without the components changing.
*/

const ICONS: Record<FeatureIcon, typeof AwardIcon> = {
    award: AwardIcon,
    scissors: ScissorsIcon,
    coffee: CoffeeIcon,
    shield: ShieldIcon,
};

export interface FeatureCardProps {
    feature: Feature;
}

export function FeatureCard({ feature }: FeatureCardProps) {
    const Icon = ICONS[feature.icon];

    return (
        <li className="group rounded-2xl border border-border bg-bg-elevated p-6 transition-all duration-300 hover:border-accent/60">
            <span
                className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent transition-all duration-300 group-hover:bg-accent/20"
                aria-hidden="true"
            >
                <Icon className="h-5 w-5" />
            </span>

            <h3 className="mt-5 font-display text-lg font-semibold text-text-primary">
                {feature.title}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{feature.text}</p>
        </li>
    );
}

export default FeatureCard;
