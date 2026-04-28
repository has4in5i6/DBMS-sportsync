import { useId, useState } from 'react';

const EyeIcon = ({ hidden }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
    {hidden && <path d="M4 4l16 16" />}
  </svg>
);

export default function Input({ label, as = 'input', options = [], ...props }) {
  const Component = as;
  const inputId = useId();
  const isPassword = Component === 'input' && props.type === 'password';
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      {Component === 'select' ? (
        <select id={inputId} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : isPassword ? (
        <div className="password-wrap">
          <input
            id={inputId}
            {...props}
            type={showPassword ? 'text' : 'password'}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            <EyeIcon hidden={!showPassword} />
          </button>
        </div>
      ) : (
        <Component id={inputId} {...props} />
      )}
    </div>
  );
}
