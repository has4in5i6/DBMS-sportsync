const Input = ({ label, ...props }) => (
  <label>
    {label}
    <input {...props} />
  </label>
);
export default Input;
