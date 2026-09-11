import MaterialIcon from './MaterialIcon.jsx';
import SelectMenu from './SelectMenu.jsx';

const SIZE_CLASS = {
  default: 'px-3 py-3.5',
  compact: 'px-3 py-2.5 text-sm',
};

export default function Field({
  as = 'input',
  id,
  name,
  label,
  icon,
  hint,
  size = 'default',
  invalid = false,
  className = '',
  children,
  ...controlProps
}) {
  const controlId = id || name;
  const padding = SIZE_CLASS[size] || SIZE_CLASS.default;
  const Tag = as === 'textarea' ? 'textarea' : 'input';

  if (as === 'select') {
    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {label ? (
          <label htmlFor={controlId} className="text-label-md font-medium tracking-wider text-on-surface-variant uppercase">
            {label}
          </label>
        ) : null}
        <SelectMenu
          id={controlId}
          name={name}
          icon={icon}
          size={size}
          invalid={invalid}
          value={controlProps.value}
          onChange={controlProps.onChange}
          required={controlProps.required}
          disabled={controlProps.disabled}
        >
          {children}
        </SelectMenu>
        {hint ? <p className="ps-1 text-xs text-on-surface-variant">{hint}</p> : null}
      </div>
    );
  }

  return (
    <div className={`group flex flex-col gap-1.5 ${className}`}>
      {label ? (
        <label htmlFor={controlId} className="text-label-md font-medium tracking-wider text-on-surface-variant uppercase">
          {label}
        </label>
      ) : null}
      <div
        className={`flex rounded-xl bg-surface-container-low ring-1 transition-shadow ${
          as === 'textarea' ? 'items-start' : 'items-center'
        } ${
          invalid
            ? 'ring-error focus-within:ring-2 focus-within:ring-error'
            : 'ring-transparent focus-within:ring-2 focus-within:ring-primary'
        }`}
      >
        {icon ? (
          <MaterialIcon
            name={icon}
            className={`pointer-events-none ms-3 shrink-0 text-[20px] text-on-surface-variant/50 group-focus-within:text-primary ${
              as === 'textarea' ? 'mt-3.5' : ''
            }`}
          />
        ) : null}
        <Tag
          id={controlId}
          name={name}
          aria-invalid={invalid || undefined}
          {...controlProps}
          className={`w-full min-w-0 bg-transparent text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
            as === 'textarea' ? 'min-h-[5.5rem] resize-y' : ''
          } ${padding}`}
        />
        {children}
      </div>
      {hint ? <p className="ps-1 text-xs text-on-surface-variant">{hint}</p> : null}
    </div>
  );
}
