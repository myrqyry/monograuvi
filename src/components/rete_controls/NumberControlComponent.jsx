import React from 'react';

export function NumberControlComponent({ data }) {
  // data is expected to be an object containing:
  // - value: the current value of the control
  // - label: the label for the control
  // - onChange: a function to call when the value changes, e.g., (newValue) => node.setPropertyAndRecord(key, newValue, history)
  // - options: { min, max, step }
  // - controlKey: the key of the control on the node

  const { value, label, onChange, options = {}, controlKey } = data;
  const { min, max, step } = options;

  const handleChange = (event) => {
    const newValue = parseFloat(event.target.value);
    if (!isNaN(newValue)) {
      onChange(newValue); // This will call node.setPropertyAndRecord(...)
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '5px', width: '100%' }}>
      <label htmlFor={controlKey} style={{ fontSize: '12px', color: '#ddd', marginBottom: '2px' }}>
        {label || controlKey}
      </label>
      <input
        id={controlKey}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        style={{
          width: 'calc(100% - 10px)', // Adjust width as needed
          padding: '4px',
          border: '1px solid #555',
          borderRadius: '3px',
          backgroundColor: '#333',
          color: '#fff',
          fontSize: '13px',
        }}
      />
    </div>
  );
}

export default NumberControlComponent;
