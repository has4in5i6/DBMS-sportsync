export default function Input({ label, as = 'input', options = [], ...props }) {
  const Component = as;

  return (
    <label className="field">
      <span>{label}</span>
      {Component === 'select' ? (
        <select {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <Component {...props} />
      )}
    </label>
  );
}
