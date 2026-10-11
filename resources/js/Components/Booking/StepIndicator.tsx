import { CheckIcon } from '@/lib/icons';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| StepIndicator
|--------------------------------------------------------------------------
| Progress header for the four-step wizard. Renders as an ordered list so the
| sequence is conveyed to assistive technology, with:
|   - `aria-current="step"` on the active step,
|   - a "выполнено" hint on completed steps (which are clickable to go back),
|   - a progress bar underneath for a quick visual read on mobile.
|
| Steps that the wizard skips (e.g. master selection when ?master_id= is in the
| URL) are still shown, because they represent a decision that has already been
| made rather than a missing one.
*/

export interface StepIndicatorStep {
    id: number;
    label: string;
    /** Short description shown under the label on wide screens. */
    hint?: string;
}

export interface StepIndicatorProps {
    steps: readonly StepIndicatorStep[];
    current: number;
    /** Highest step the visitor has unlocked; later steps are not clickable. */
    furthest: number;
    onStepClick?: (step: number) => void;
    className?: string;
}

export function StepIndicator({
    steps,
    current,
    furthest,
    onStepClick,
    className,
}: StepIndicatorProps) {
    const progress = ((current - 1) / Math.max(1, steps.length - 1)) * 100;

    return (
        <div className={cn('w-full', className)}>
            <ol className="flex items-start justify-between gap-2">
                {steps.map((step, index) => {
                    const completed = step.id < current;
                    const active = step.id === current;
                    const reachable = step.id <= furthest;
                    const clickable = completed && reachable && onStepClick !== undefined;

                    return (
                        <li key={step.id} className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center">
                            <div className="flex w-full items-center">
                                {/* Connector on the left of every step but the first. */}
                                <span
                                    className={cn(
                                        'h-px flex-1',
                                        index === 0
                                            ? 'bg-transparent'
                                            : completed || active
                                              ? 'bg-accent/60'
                                              : 'bg-border',
                                    )}
                                    aria-hidden="true"
                                />

                                <button
                                    type="button"
                                    onClick={clickable ? () => onStepClick(step.id) : undefined}
                                    disabled={!clickable}
                                    aria-current={active ? 'step' : undefined}
                                    className={cn(
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-medium',
                                        'transition-all duration-300 focus-visible:ring-2 focus-visible:ring-accent',
                                        active && 'border-accent bg-accent text-bg-primary',
                                        completed && 'border-accent bg-accent/15 text-accent',
                                        !active && !completed && 'border-border bg-bg-secondary text-text-secondary',
                                        clickable
                                            ? 'cursor-pointer hover:border-accent hover:text-accent'
                                            : 'cursor-default',
                                    )}
                                >
                                    {completed ? (
                                        <>
                                            <CheckIcon className="h-4 w-4" />
                                            <span className="sr-only">
                                                Шаг {step.id} выполнен: {step.label}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            {step.id}
                                            <span className="sr-only">
                                                Шаг {step.id}: {step.label}
                                            </span>
                                        </>
                                    )}
                                </button>

                                <span
                                    className={cn(
                                        'h-px flex-1',
                                        index === steps.length - 1
                                            ? 'bg-transparent'
                                            : completed
                                              ? 'bg-accent/60'
                                              : 'bg-border',
                                    )}
                                    aria-hidden="true"
                                />
                            </div>

                            <span className="min-w-0">
                                <span
                                    className={cn(
                                        'block truncate text-xs font-medium sm:text-sm',
                                        active ? 'text-text-primary' : 'text-text-secondary',
                                    )}
                                    aria-hidden="true"
                                >
                                    {step.label}
                                </span>

                                {step.hint !== undefined && (
                                    <span className="mt-0.5 hidden truncate text-xs text-text-secondary/70 lg:block" aria-hidden="true">
                                        {step.hint}
                                    </span>
                                )}
                            </span>
                        </li>
                    );
                })}
            </ol>

            {/* Progress bar: redundant with the steps above, which is why it is
                decorative and hidden from assistive technology. */}
            <div className="mt-6 h-1 overflow-hidden rounded-full bg-border" aria-hidden="true">
                <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${Math.max(4, progress)}%` }}
                />
            </div>
        </div>
    );
}

export default StepIndicator;
