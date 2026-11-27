import {
  type ButtonHTMLAttributes,
  cloneElement,
  type ComponentProps,
  Fragment,
  type HTMLAttributes,
  isValidElement,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  useEffect,
  useId,
  useRef,
} from 'react';
import { Link, type LinkProps } from 'react-router';
import { Icon, type IconName } from './Icon';
import './ui.css';

/* ------------------------------------------------------------------ */
/* Button                                                             */
/* ------------------------------------------------------------------ */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: boolean;
  loading?: boolean;
}

export type ButtonProps = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { ref?: Ref<HTMLButtonElement> };

function buttonClass({
  variant = 'secondary',
  size = 'md',
  block,
  icon,
  className,
}: ButtonBaseProps & { className?: string }) {
  return [
    'btn',
    `btn--${variant}`,
    size !== 'md' && `btn--${size}`,
    block && 'btn--block',
    icon && 'btn--icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function Button({
  variant,
  size,
  block,
  icon,
  loading,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, block, icon, className })}
      disabled={(disabled ?? false) || (loading ?? false)}
      aria-busy={loading ? true : undefined}
      {...rest}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export type LinkButtonProps = ButtonBaseProps & LinkProps;

export function LinkButton({
  variant,
  size,
  block,
  icon,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link className={buttonClass({ variant, size, block, icon, className })} {...rest}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Card                                                               */
/* ------------------------------------------------------------------ */
export function Card({
  children,
  className,
  as: Tag = 'div',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>) {
  return (
    <Tag className={['card', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Tag>
  );
}

export function CardLink({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} className={['card', 'card--interactive', className].filter(Boolean).join(' ')}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Badge / Stat / Alert                                               */
/* ------------------------------------------------------------------ */
export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={['badge', tone !== 'neutral' && `badge--${tone}`, className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}

export function Stat({ value, label }: { value: ReactNode; label: ReactNode }) {
  return (
    <div className="stat">
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  );
}

export function Alert({
  tone = 'neutral',
  children,
  role = 'status',
}: {
  tone?: Tone;
  children: ReactNode;
  role?: 'status' | 'alert';
}) {
  return (
    <div
      role={role}
      className={['alert', tone !== 'neutral' && `alert--${tone}`].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Progress                                                           */
/* ------------------------------------------------------------------ */
export function ProgressBar({
  value,
  max = 1,
  label,
  valueText,
}: {
  value: number;
  max?: number;
  label?: string;
  /**
   * What a screen reader says for the value. Defaults to the percentage, so a
   * byte count or a score never comes out as a raw number.
   */
  valueText?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText ?? `${Math.round(pct)}%`}
      aria-label={label}
    >
      <div className="progress__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form controls                                                      */
/* ------------------------------------------------------------------ */
/**
 * A labelled control with an optional hint. The hint is announced with the
 * control: when the render prop returns a single element (an Input, a Select,
 * a textarea), it gets `aria-describedby` pointing at the hint. A fragment of
 * several elements is left alone — pass the second argument on yourself.
 */
export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const describedBy = hint ? hintId : undefined;
  let control = children(id, describedBy);
  if (describedBy && isValidElement(control) && control.type !== Fragment) {
    const element = control as ReactElement<{ 'aria-describedby'?: string }>;
    const existing = element.props['aria-describedby'];
    const ids = existing ? existing.split(/\s+/) : [];
    if (!ids.includes(hintId)) {
      control = cloneElement(element, { 'aria-describedby': [...ids, hintId].join(' ') });
    }
  }
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {control}
      {hint ? (
        <span className="field__hint" id={hintId}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="select" {...props} />;
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={className ? `input ${className}` : 'input'} {...props} />;
}

/**
 * A switch with a label and an optional description. The whole row toggles it;
 * the name is the label alone and the description is announced separately.
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  return (
    <label className={disabled ? 'switch switch--disabled' : 'switch'}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch__track" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
      <span className="switch__label">
        <span id={labelId}>{label}</span>
        {description ? <small id={descriptionId}>{description}</small> : null}
      </span>
    </label>
  );
}

/**
 * One choice out of a few, shown side by side. A radio group: one tab stop,
 * the arrow keys move between the options (and select them, like native
 * radios), Home and End jump to the ends. `value` is null when none of the
 * options describes what the page shows; the first option then takes the tab stop.
 */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  block = false,
}: {
  value: T | null;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
  ariaLabel: string;
  /** Take the full width, the options sharing it (a choice of two or three in a card). */
  block?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const selectedIndex = options.findIndex((opt) => opt.value === value);
  /** The one option in the tab order: the selected one, or the first when none is. */
  const focusIndex = selectedIndex === -1 ? 0 : selectedIndex;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const count = options.length;
    if (count === 0) return;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (focusIndex + 1) % count;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (focusIndex - 1 + count) % count;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const option = options[next];
    if (!option) return;
    if (option.value !== value) onChange(option.value);
    ref.current?.querySelectorAll<HTMLButtonElement>('.segmented__option')[next]?.focus();
  };

  return (
    <div
      className={block ? 'segmented segmented--block' : 'segmented'}
      role="radiogroup"
      aria-label={ariaLabel}
      ref={ref}
      onKeyDown={onKeyDown}
    >
      {options.map((opt, index) => (
        <button
          key={String(opt.value)}
          type="button"
          role="radio"
          className="segmented__option"
          aria-checked={opt.value === value}
          tabIndex={index === focusIndex ? 0 : -1}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                               */
/* ------------------------------------------------------------------ */

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: IconName;
}

/**
 * Tabs that switch what a page shows (the WAI-ARIA tabs pattern): one tab
 * stop, the arrow keys move between the tabs and open them, Home and End jump
 * to the ends. Tab `id` controls the panel `${idPrefix}-panel-${id}`, which
 * `TabPanel` renders.
 */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  idPrefix,
}: {
  tabs: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  idPrefix: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const selected = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === value),
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const count = tabs.length;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (selected + 1) % count;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (selected - 1 + count) % count;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    if (tab.id !== value) onChange(tab.id);
    ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div className="tabs" role="tablist" aria-label={ariaLabel} ref={ref} onKeyDown={onKeyDown}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${tab.id}`}
          aria-controls={`${idPrefix}-panel-${tab.id}`}
          aria-selected={tab.id === value}
          tabIndex={index === selected ? 0 : -1}
          className="tabs__tab"
          onClick={() => onChange(tab.id)}
        >
          {tab.icon ? <Icon name={tab.icon} size={18} /> : null}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * The panel a tab of `Tabs` controls. Every tab's panel is in the page (so
 * each tab points at one), but only the open one holds its content.
 */
export function TabPanel({
  idPrefix,
  id,
  active,
  children,
  className,
}: {
  idPrefix: string;
  id: string;
  active: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${id}`}
      aria-labelledby={`${idPrefix}-tab-${id}`}
      hidden={!active}
      className={className}
    >
      {active ? children : null}
    </div>
  );
}

/**
 * A labelled range input that shows its value. `format` turns the number into
 * the text shown beside the label and read by screen readers.
 */
export function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  format = (v) => String(v),
  disabled,
  className,
  ...rest
}: {
  label: ReactNode;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
} & Omit<ComponentProps<'input'>, 'type' | 'value' | 'min' | 'max' | 'step' | 'onChange'>) {
  const id = useId();
  return (
    <div className={className ? `slider ${className}` : 'slider'}>
      <div className="slider__head">
        <label className="slider__label" htmlFor={id}>
          {label}
        </label>
        {/* The value is read from the slider itself (aria-valuetext). */}
        <output className="slider__value" htmlFor={id} aria-hidden="true">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="slider__input"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        {...rest}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dialog (native <dialog>)                                           */
/* ------------------------------------------------------------------ */
/**
 * A modal dialog on the native element. `onClose` fires exactly once per close,
 * from the element's own `close` event, whichever way it closed: Escape, the
 * backdrop, the close button in the title row, an action calling `close`, or
 * the parent setting `open` to false. Actions can be a render prop that
 * receives `close`, for buttons that should shut the dialog themselves.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  dismissible = true,
  wide = false,
  danger = false,
  stackActions = false,
  closeLabel = 'Close',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode | ((close: () => void) => ReactNode);
  /** Allow closing with Escape, the backdrop and the close button. */
  dismissible?: boolean;
  /** Use most of the viewport width (for editors and tables). */
  wide?: boolean;
  /** Destructive confirmation: carries a Signal Crimson top accent rule. */
  danger?: boolean;
  /**
   * The ways on at the end of a game, three or more: two to a row, the main one the full width
   * under them, rather than a row that wraps where it happens to.
   */
  stackActions?: boolean;
  /** Accessible name of the close button in the title row. */
  closeLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  /** Where the pointer went down: a click only dismisses when it began on the backdrop too. */
  const pressedBackdrop = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.returnValue = '';
      el.showModal();
    }
    if (!open && el.open) el.close();
  }, [open]);

  const close = () => {
    const el = ref.current;
    if (el?.open) el.close();
  };

  return (
    <dialog
      ref={ref}
      className={['dialog', wide && 'dialog--wide', danger && 'dialog--danger']
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={titleId}
      // React passes a nested dialog's close and cancel events up to this one too (a
      // confirmation inside the library, say): only this dialog's own events count.
      onClose={(e) => {
        if (e.target === e.currentTarget) {
          e.currentTarget.returnValue = '';
          onClose();
        }
      }}
      onCancel={(e) => {
        if (e.target === e.currentTarget && !dismissible) e.preventDefault();
      }}
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === ref.current;
      }}
      onClick={(e) => {
        const onBackdrop = e.target === ref.current;
        const started = pressedBackdrop.current;
        pressedBackdrop.current = false;
        // A drag that starts on the content and ends on the backdrop (selecting
        // text) is not a dismissal.
        if (dismissible && onBackdrop && started) close();
      }}
    >
      <div className={dismissible ? 'dialog__body dialog__body--closable' : 'dialog__body'}>
        <h2 className="dialog__title" id={titleId}>
          {title}
        </h2>
        {children}
        {actions ? (
          <div
            className={stackActions ? 'dialog__actions dialog__actions--stack' : 'dialog__actions'}
          >
            {typeof actions === 'function' ? actions(close) : actions}
          </div>
        ) : null}
      </div>
      {/* Last in the DOM so opening the dialog still focuses the first control of
          the content; the stylesheet pins it to the title row. */}
      {dismissible ? (
        <Button
          variant="ghost"
          size="sm"
          icon
          className="dialog__close"
          aria-label={closeLabel}
          onClick={close}
        >
          <Icon name="close" size={18} />
        </Button>
      ) : null}
    </dialog>
  );
}

/**
 * The one way to ask "are you sure?". The dismiss button comes first and the
 * confirming action last, always in that order, so the dangerous button is
 * never where the safe one was on the previous dialog. `onConfirm` runs, then
 * the dialog closes and `onClose` fires as for any other close.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: ReactNode;
  /** The question, and what the action will do. */
  children: ReactNode;
  confirmLabel: ReactNode;
  cancelLabel?: ReactNode;
  /** The action destroys something: the confirming button is styled as a danger. */
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      danger={danger}
      actions={(close) => (
        <>
          <Button
            variant="secondary"
            autoFocus={danger}
            onClick={close}
            data-testid="confirm-cancel"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            className={danger ? 'btn--danger-solid' : undefined}
            onClick={() => {
              onConfirm();
              close();
            }}
            data-testid="confirm-accept"
          >
            {confirmLabel}
          </Button>
        </>
      )}
    >
      {children}
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Misc                                                               */
/* ------------------------------------------------------------------ */
export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span className="row" role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="small muted">{label}</span>
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

export function EmptyState({
  icon,
  title,
  children,
  headingLevel = 3,
}: {
  icon?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  /** The title's heading level: 1 when the empty state is the whole page. */
  headingLevel?: 1 | 2 | 3 | 4;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div className="empty">
      {icon ? (
        <div className="empty__icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <Heading className="empty__title">{title}</Heading>
      {children}
    </div>
  );
}

/**
 * The one "not found" page: the whole page when the URL is unknown, or a
 * section's page when an id in the URL (a lesson, a study, a course) has no
 * content behind it. An h1 (there is no other heading on such a page) and a
 * way back to the section it belongs to.
 */
export function NotFound({
  title = 'That square is off the board',
  children,
  backTo = '/',
  backLabel = 'Back to home',
  icon = <Icon name="knight" size={40} />,
}: {
  title?: ReactNode;
  /** What was looked for and could not be found; a sentence or two. */
  children?: ReactNode;
  /** The section this page belongs to. */
  backTo?: string;
  backLabel?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <EmptyState icon={icon} title={title} headingLevel={1}>
      {children}
      <div className="row empty__actions">
        <LinkButton variant="primary" to={backTo}>
          {backLabel}
        </LinkButton>
      </div>
    </EmptyState>
  );
}

/**
 * A horizontally scrolling wrapper (wide tables, move histories) that the
 * keyboard can scroll: it is a labelled region with a tab stop, since a
 * container with no focusable content cannot otherwise be scrolled with the
 * arrow keys.
 */
export function ScrollRegion({
  label,
  children,
  className,
  ...rest
}: {
  label: string;
  children: ReactNode;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>) {
  return (
    <div
      className={['history__scroll', className].filter(Boolean).join(' ')}
      role="region"
      aria-label={label}
      tabIndex={0}
      {...rest}
    >
      {children}
    </div>
  );
}

export { Icon, type IconName, type IconProps, Stars } from './Icon';
