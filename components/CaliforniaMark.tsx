interface Props {
  className?: string;
  label?: string;
}

export default function CaliforniaMark({ className = 'h-10 w-10', label = 'California Settlement Calculator' }: Props) {
  return (
    <img
      src="/logo.svg"
      alt={label}
      title={label}
      className={`inline-block object-contain ${className}`}
    />
  );
}
