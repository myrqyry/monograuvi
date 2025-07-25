import React from 'react';

function ColorPickerControlComponent({ data, onUpdate }) {
  const handleChange = (event) => {
    onUpdate(event.target.value);
  };

  return (
    <div className="color-picker-control">
      <input type="color" value={data.value} onChange={handleChange} />
    </div>
  );
}

export default ColorPickerControlComponent;
