import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ConfirmationModal } from './ConfirmationModal';

interface SelectWithCreateProps {
  label: string;
  labelAction?: React.ReactNode;
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
  onCreate: (newValue: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export const SelectWithCreate: React.FC<SelectWithCreateProps> = ({
  label,
  labelAction,
  options,
  value,
  onChange,
  onCreate,
  placeholder = 'Select...',
  disabled = false,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [tempCreateValue, setTempCreateValue] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search term if no selection was made and closed
        if (!value) setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const filteredOptions = useMemo(() => {
    return options.filter(opt => 
      opt.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleCreateRequest = () => {
    if (!searchTerm.trim()) return;
    setTempCreateValue(searchTerm);
    setShowConfirm(true);
    setIsOpen(false);
  };

  const confirmCreate = () => {
    onCreate(tempCreateValue);
    onChange(tempCreateValue);
    setShowConfirm(false);
    setSearchTerm('');
    setTempCreateValue('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
  };

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const exactMatch = options.some(opt => opt.toLowerCase() === searchTerm.toLowerCase());

  // PrimeReact-like styling classes
  const inputBorderClass = isOpen 
    ? 'border-blue-500 ring-2 ring-blue-100' 
    : 'border-gray-300 hover:border-blue-400';
  
  const disabledClass = disabled 
    ? 'bg-gray-100 cursor-not-allowed opacity-70' 
    : 'bg-white cursor-pointer';

  return (
    <div className="relative w-full group mb-1" ref={containerRef}>
      {/* Label Row */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-semibold text-gray-700 ml-1">
          {label}
        </label>
        {labelAction && <div className="ml-2">{labelAction}</div>}
      </div>

      {/* Main Input Container */}
      <div 
        onClick={toggleOpen}
        className={`
          relative flex items-center justify-between w-full h-11 px-3 
          border rounded-lg transition-all duration-200 
          ${inputBorderClass}
          ${disabledClass}
        `}
      >
        <div className="flex-1 flex items-center overflow-hidden">
          {value ? (
            <span className="text-gray-900 font-medium truncate">{value}</span>
          ) : (
            <span className="text-gray-400 text-sm select-none">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-2 pl-2">
           {/* Clear Button (Remove Selection) */}
           {value && !disabled && (
            <button 
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors z-10"
              title="Clear selection"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}

          {/* Loading or Chevron */}
          {isLoading ? (
             <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
           ) : (
            <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
           )}
        </div>
      </div>

      {/* Dropdown Panel */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
          
          {/* Search Input Area */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white placeholder-gray-400 text-gray-800"
                placeholder="Search or add new..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (filteredOptions.length > 0 && exactMatch) {
                        // Select exact match
                        handleSelect(filteredOptions[0]);
                    } else if (searchTerm && !exactMatch) {
                        // Create
                        handleCreateRequest();
                    }
                  }
                }}
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>

          {/* Options List */}
          <ul ref={listRef} className="max-h-[240px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <li 
                  key={`${opt}-${idx}`}
                  onClick={() => handleSelect(opt)}
                  className={`
                    px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between group
                    ${value === opt ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  <span>{opt}</span>
                  {value === opt && (
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </li>
              ))
            ) : (
               searchTerm === '' && (
                 <li className="px-4 py-8 text-center text-gray-400 text-xs uppercase tracking-wide">
                   No options available
                 </li>
               )
            )}

            {/* Create Option */}
            {searchTerm && !exactMatch && (
              <li 
                onClick={handleCreateRequest}
                className="px-4 py-3 text-sm text-blue-600 cursor-pointer hover:bg-blue-50 border-t border-gray-100 flex items-center gap-2 font-medium transition-colors bg-gray-50/30"
              >
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                </div>
                <div className="flex flex-col">
                    <span>Create "<span className="font-bold">{searchTerm}</span>"</span>
                    <span className="text-[10px] text-gray-500 font-normal">Item does not exist, tap to add</span>
                </div>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Confirmation Modal for Creation */}
      <ConfirmationModal
        isOpen={showConfirm}
        itemName={tempCreateValue}
        levelName={label}
        onConfirm={confirmCreate}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};
