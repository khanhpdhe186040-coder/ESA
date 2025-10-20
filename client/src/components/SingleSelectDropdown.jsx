import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Custom Single-Select Dropdown Component
 * @param {object} props
 * @param {string} props.label - Label for the control (e.g., "Course")
 * @param {string} props.name - Name attribute for the underlying form field (e.g., "courseId")
 * @param {Array<object>} props.options - List of available options: [{ _id: string, name: string }]
 * @param {string} props.selectedValue - ID of the currently selected option
 * @param {function(string, string): void} props.onChange - Handler to call when selection changes (field name, new value)
 * @param {string} [props.error] - Error message to display
 * @param {boolean} [props.isSmall=false] - Use smaller styling for schedule configuration
 */
const SingleSelectDropdown = ({ label, name, options, selectedValue, onChange, error, isSmall = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close the dropdown if a click is detected outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOptionSelect = (value) => {
        onChange(name, value);
        setIsOpen(false); // Close menu after selection
    };

    // Helper to display the name of the selected item
    const displaySelectedName = () => {
        if (!selectedValue) {
            return `-- Select ${label} --`;
        }
        const selectedOption = options.find(o => o._id === selectedValue);
        return selectedOption ? selectedOption.name : `Selected ID: ${selectedValue}`;
    };

    const buttonClasses = isSmall 
        ? "px-3 py-2 text-sm" 
        : "px-4 py-2.5 text-base";
        
    const panelMaxHeight = isSmall ? "max-h-40" : "max-h-60";

    return (
        <div className="relative" ref={dropdownRef}>
            <label className={`${isSmall ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>{label}</label>

            {/* Dropdown Button - Giao diện giống MultiSelect */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full border ${error ? 'border-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'} bg-white rounded-xl ${buttonClasses} mt-1 transition text-left flex justify-between items-center text-gray-800`}
            >
                <span className="truncate">{displaySelectedName()}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Panel - Giao diện giống MultiSelect */}
            {isOpen && (
                <div className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg ${panelMaxHeight} overflow-y-auto`}>
                    {options.length > 0 ? (
                        options.map((option) => {
                            const isSelected = selectedValue === option._id;
                            return (
                                <div
                                    key={option._id}
                                    onClick={() => handleOptionSelect(option._id)}
                                    className={`flex items-center justify-between px-4 py-2 cursor-pointer transition ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                                >
                                    <span>{option.name}</span>
                                    {isSelected && <Check className="w-4 h-4" />}
                                </div>
                            );
                        })
                    ) : (
                        <div className="px-4 py-2 text-gray-500 italic">No options available.</div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
        </div>
    );
};

export default SingleSelectDropdown;