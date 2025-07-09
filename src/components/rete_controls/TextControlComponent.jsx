import React from 'react';

export function TextControlComponent({ data }) {
  // data is expected to be an object containing:
  // - value: the current string value of the control
  // - label: the label for the control
  // - onChange: a function to call when the value changes, e.g., (newValue) => node.setPropertyAndRecord(key, newValue, history)
  // - controlKey: the key of the control on the node
  // - options: { placeholder, multiline (boolean) } // Optional: placeholder text, and if it should be a textarea

  const { value, label, onChange, options = {}, controlKey } = data;
  const { placeholder, multiline } = options;

  const handleChange = (event) => {
    const newValue = event.target.value;
    onChange(newValue); // This will call node.setPropertyAndRecord(...)
  };

  const commonStyles = {
    width: 'calc(100% - 10px)', // Adjust width as needed
    padding: '4px',
    border: '1px solid #555',
    borderRadius: '3px',
    backgroundColor: '#333',
    color: '#fff',
    fontSize: '13px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '5px', width: '100%' }}>
      <label htmlFor={controlKey} style={{ fontSize: '12px', color: '#ddd', marginBottom: '2px' }}>
        {label || controlKey}
      </label>
      {multiline ? (
        <textarea
          id={controlKey}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={options.rows || 3} // Default to 3 rows for textarea
          style={{ ...commonStyles, resize: 'vertical' }}
        />
      ) : (
        <input
          id={controlKey}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          style={commonStyles}
        />
      )}
    </div>
  );
}

export default TextControlComponent;
