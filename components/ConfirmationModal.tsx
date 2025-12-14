import React from 'react';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  itemName: string;
  levelName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  itemName,
  levelName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      ></div>
      
      {/* Modal Content */}
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 relative z-10 transform animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-1">Add New Item</h3>
          <p className="text-sm text-center text-gray-500 mb-6 leading-relaxed">
            Are you sure you want to add <span className="font-semibold text-gray-900 bg-gray-100 px-1 py-0.5 rounded">"{itemName}"</span> to the <span className="font-semibold">{levelName}</span> list?
          </p>

          <div className="flex w-full gap-3">
            <Button variant="secondary" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={onConfirm} className="flex-1">
              Create Item
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};