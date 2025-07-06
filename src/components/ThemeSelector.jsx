// src/components/ThemeSelector.jsx
import React from 'react';

const themes = [
  { id: 'catppuccin-mocha', name: 'Catppuccin Mocha', colors: ['#cba6f7', '#89b4fa', '#f9e2af'] },
  { id: 'dracula', name: 'Dracula', colors: ['#bd93f9', '#ff79c6', '#50fa7b'] },
  { id: 'nord', name: 'Nord', colors: ['#88c0d0', '#81a1c1', '#8fbcbb'] },
  { id: 'tokyo-night', name: 'Tokyo Night', colors: ['#7aa2f7', '#bb9af7', '#9ece6a'] },
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
              {theme.colors.map(color => (
                <div 
                  key={color} 
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
