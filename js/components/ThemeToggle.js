// js/components/ThemeToggle.js

export function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    // Check for saved user preference, else check system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Determine the initial theme
    const currentTheme = savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'light');
    
    // Apply the initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Toggle event listener
    toggleBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        let newTheme = theme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}
