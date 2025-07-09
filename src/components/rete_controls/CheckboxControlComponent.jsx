import React from 'react';

export function CheckboxControlComponent({ data }) {
  // data is expected to be an object containing:
  // - value: the current boolean value of the control
  // - label: the label for the control
  // - onChange: a function to call when the value changes, e.g., (newValue) => node.setPropertyAndRecord(key, newValue, history)
  // - controlKey: the key of the control on the node

  const { value, label, onChange, controlKey } = data;

  const handleChange = (event) => {
    const newValue = event.target.checked;
    onChange(newValue); // This will call node.setPropertyAndRecord(...)
  };

  return (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '5px',
        width: '100%',
        padding: '4px 0' // Add some padding
    }}>
      <input
        type="checkbox"
        id={controlKey}
        checked={!!value} // Ensure value is explicitly boolean for controlled component
        onChange={handleChange}
        style={{
          marginRight: '8px',
          height: '16px', // Consistent sizing
          width: '16px',
          cursor: 'pointer',
        }}
      />
      <label
        htmlFor={controlKey}
        style={{
            fontSize: '13px',
            color: '#ddd',
            cursor: 'pointer',
            flexGrow: 1 // Allow label to take available space
        }}
      >
        {label || controlKey}
      </label>
    </div>
  );
}

export default CheckboxControlComponent;
