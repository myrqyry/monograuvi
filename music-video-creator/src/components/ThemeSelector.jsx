// src/components/ThemeSelector.jsx
import React from 'react';

const themes = [
  { id: 'catppuccin-mocha', name: 'Catppuccin Mocha', colors: ['#cba6f7', '#89b4fa', '#f9e2af'] },
  { id: 'dracula', name: 'Dracula', colors: ['#bd93f9', '#ff79c6', '#50fa7b'] },
  { id: 'nord', name: 'Nord', colors: ['#81a1c1', '#88c0d0', '#8fbcbb'] },
  { id: 'solarized', name: 'Solarized', colors: ['#b58900', '#cb4b16', '#d33682'] },
];

function ThemeSelector({ currentTheme, onChangeTheme }) {
  return (
    <div className="theme-selector">
      <div className="flex items-center space-x-2">
        {themes.map(theme => (
          <button
            key={theme.id}
            className={`theme-button ${currentTheme === theme.id ? 'active' : ''}`}
            onClick={() => onChangeTheme(theme.id)}
            title={theme.name}
          >
            <div className="theme-colors">
              {theme.colors.map((color, idx) => (
                <div 
                  key={idx} 
                  className="theme-color-swatch" 
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ThemeSelector;