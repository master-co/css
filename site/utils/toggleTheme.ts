export const toggleTheme = (): string => {
    const htmlClassList = document.documentElement.classList;
    const theme = localStorage.getItem('theme');
    const isDark = theme === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    htmlClassList.toggle('dark', !isDark);
    htmlClassList.toggle('light', isDark);
    localStorage.setItem('theme', newTheme);
    return newTheme;
};