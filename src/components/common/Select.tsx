import React, { useState, useRef, useEffect } from 'react';
import './Select.css';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  label?: string;
  variant?: 'outlined' | 'underlined';
  options: SelectOption[];
  value: string | number;
  onChange: (value: any) => void;
  error?: string;
  placeholder?: string;
  containerStyle?: React.CSSProperties;
  name?: string;
}

export default function Select({
  label,
  variant = 'outlined',
  options,
  value,
  onChange,
  error,
  placeholder = 'Selecione...',
  containerStyle,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleSelect = (optionValue: string | number) => {
    onChange({ target: { value: optionValue } }); // Mantém compatibilidade com o formato de evento do React
    setIsOpen(false);
  };

  return (
    <div className="custom-select-wrapper" style={containerStyle} ref={containerRef}>
      {label && (
        <label className={`select-label ${variant === 'underlined' ? 'select-label-underlined' : ''}`}>
          {label}
        </label>
      )}
      
      <div className={`select-custom-container ${variant} ${isOpen ? 'is-open' : ''} ${error ? 'has-error' : ''}`}>
        <div className="select-trigger" onClick={handleToggle}>
          <span className={`trigger-text ${!selectedOption ? 'placeholder' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="select-arrow-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>

        {isOpen && (
          <div className="select-dropdown-menu">
            <div className="select-options-list">
              {options.map((option) => (
                <div 
                  key={option.value} 
                  className={`select-option-item ${option.value === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                  {option.value === value && (
                    <svg className="check-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  )}
                </div>
              ))}
              {options.length === 0 && <div className="select-no-options">Nenhuma opção disponível</div>}
            </div>
          </div>
        )}
      </div>
      
      {error && <span className="select-error-message">{error}</span>}
    </div>
  );
}
