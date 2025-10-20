import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Custom Multi-Select Dropdown Component
 * @param {object} props
 * @param {string} props.label - Label for the control (e.g., "Teachers")
 * @param {string} props.name - Name attribute for the underlying form field
 * @param {Array<object>} props.options - List of available options: [{ _id: string, name: string }]
 * @param {Array<string>} props.selectedValues - Array of currently selected IDs
 * @param {function(string, Array<string>): void} props.onChange - Handler to call when selection changes (field name, new values)
 * @param {string} [props.error] - Error message to display
 */
const MultiSelectDropdown = ({ label, name, options, selectedValues, onChange, error }) => {
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

    const toggleOption = (value) => {
        const isSelected = selectedValues.includes(value);
        let newSelection;

        if (isSelected) {
            // Remove the value
            newSelection = selectedValues.filter(v => v !== value);
        } else {
            // Add the value
            newSelection = [...selectedValues, value];
        }

        // Call the parent handler
        onChange(name, newSelection);
    };

    // Helper to display a summary of selected items
    const displaySelectedSummary = () => {
        if (selectedValues.length === 0) {
            return `Select ${label}...`;
        }
        if (selectedValues.length === 1) {
            const selectedOption = options.find(o => o._id === selectedValues[0]);
            return selectedOption ? selectedOption.name : "1 selected";
        }
        return `${selectedValues.length} ${label.toLowerCase()} selected`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="text-sm font-medium text-gray-700">{label}</label>

            {/* Dropdown Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full border ${error ? 'border-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'} bg-white rounded-xl px-4 py-2.5 mt-1 transition text-left flex justify-between items-center text-gray-800 text-base`}
            >
                <span className="truncate">{displaySelectedSummary()}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {options.length > 0 ? (
                        options.map((option) => {
                            const isSelected = selectedValues.includes(option._id);
                            return (
                                <div
                                    key={option._id}
                                    onClick={() => toggleOption(option._id)}
                                    className={`flex items-center justify-between px-4 py-2 cursor-pointer transition ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
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

export default MultiSelectDropdown;