const LoadingSpinner = ({ size = 'md', color = 'primary' }) => {
  const sizeClass = {
    sm: 'spinner-border-sm',
    md: '',
    lg: 'spinner-border-lg'
  }[size];

  const colorClass = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    light: 'text-light',
    dark: 'text-dark'
  }[color];

  return (
    <div className={`spinner-border ${sizeClass} ${colorClass}`} role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;