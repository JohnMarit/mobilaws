import React, { useState } from 'react';
import { ChevronDown, User, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCounselName } from '@/contexts/CounselNameContext';

interface CounselNameSelectorProps {
  className?: string;
}

export default function CounselNameSelector({ className = '' }: CounselNameSelectorProps) {
  const { selectedName, setSelectedName, availableNames, customNames, addCustomName, deleteCustomName } = useCounselName();
  const [isOpen, setIsOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const handleNameSelect = (name: string) => {
    setSelectedName(name);
    setIsOpen(false);
  };

  const handleAddName = () => {
    if (newName.trim()) {
      const success = addCustomName(newName.trim());
      if (success) {
        setNewName('');
        setIsAddDialogOpen(false);
      } else {
        // Could add toast notification here for duplicate/invalid names
        console.warn('Failed to add custom name - may be duplicate or invalid');
      }
    }
  };

  const handleDeleteName = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomName(name);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-1 sm:px-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-1"
      >
        <User className="h-4 w-4" />
        <span className="text-xs sm:text-sm font-medium">Counsel {selectedName}</span>
        <ChevronDown className="h-3 w-3" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[250px] max-h-80 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                Choose your counsel:
              </div>
              
              {/* Default names */}
              {availableNames.filter(name => !customNames.includes(name)).map((name) => (
                <button
                  key={name}
                  onClick={() => handleNameSelect(name)}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-2 ${
                    selectedName === name ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <User className="h-3 w-3" />
                  Counsel {name}
                  {selectedName === name && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </button>
              ))}

              {/* Custom names section */}
              {customNames.length > 0 && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                    Your custom counsel:
                  </div>
                  {customNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleNameSelect(name)}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-2 group ${
                        selectedName === name ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <User className="h-3 w-3" />
                      Counsel {name}
                      <div className="ml-auto flex items-center gap-1">
                        {selectedName === name && (
                          <span className="text-blue-600">✓</span>
                        )}
                        <button
                          onClick={(e) => handleDeleteName(name, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-600 transition-opacity"
                          title="Delete custom name"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Add custom name button */}
              <div className="border-t border-gray-200 my-2"></div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <button className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-2 text-gray-600">
                    <Plus className="h-3 w-3" />
                    Add custom counsel
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Custom Counsel Name</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="counsel-name" className="text-right text-sm font-medium">
                        Name
                      </label>
                      <Input
                        id="counsel-name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter counsel name"
                        className="col-span-3"
                        maxLength={50}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddName();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setNewName('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddName}
                      disabled={!newName.trim() || newName.trim().length > 50}
                    >
                      Add Counsel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
