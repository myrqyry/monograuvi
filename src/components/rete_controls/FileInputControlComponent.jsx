import React from 'react';

function FileInputControlComponent({ data, onUpdate }) {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdate(url);
    }
  };

  return (
    <div className="file-input-control">
      <input type="file" onChange={handleFileChange} accept="audio/*" />
    </div>
  );
}

export default FileInputControlComponent;
