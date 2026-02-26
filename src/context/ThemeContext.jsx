import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    // Check localStorage first, otherwise fallback to 'dark'
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('app-theme')
        return savedTheme ? savedTheme : 'dark'
    })

    useEffect(() => {
        // Update data-theme on html element
        document.documentElement.setAttribute('data-theme', theme)
        // Save to localStorage
        localStorage.setItem('app-theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    return useContext(ThemeContext)
}
