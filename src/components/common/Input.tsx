import React, { InputHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  variant?: 'outlined' | 'underlined';
  error?: string;
  containerStyle?: React.CSSProperties;
}

export default function Input({
  label,
  variant = 'outlined',
  error,
  id,
  className = '',
  containerStyle,
  ...props
}: InputProps) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div className="input-wrapper" style={containerStyle}>
      {label && (
        <label 
          htmlFor={inputId} 
          className={`input-label ${variant === 'underlined' ? 'input-label-underlined' : ''}`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-base input-${variant} ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
}
