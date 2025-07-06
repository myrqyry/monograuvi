import React from 'react';

const VisualElements = ({ elements, onSelect }) => {
    return (
        <div className="visual-elements">
            <h2>Select Visual Elements</h2>
            <div className="elements-list">
                {elements.map((element) => (
                    <div 
                        key={element.id} 
                        className="element-item" 
                        onClick={() => onSelect(element)}
                    >
                        {element.type === 'shader' && <span>Shader: {element.name}</span>}
                        {element.type === 'image' && <img src={element.src} alt={element.name} />}
                        {element.type === 'video' && <video src={element.src} controls />}
                        {element.type === 'lyric' && <span>Lyrics: {element.text}</span>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VisualElements;
