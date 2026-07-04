/** @type {import('tailwindcss').Config} */

// Design tokens live as CSS custom properties in src/index.css (theme-wonder defaults on
// :root; Explorer band will override the same properties under a `.theme-explorer` scope).
// Here we expose them as Tailwind utilities so components use named tokens, never raw hex.
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: 'var(--color-bg)',
                'bg-card': 'var(--color-bg-card)',
                primary: 'var(--color-primary)',
                'primary-soft': 'var(--color-primary-soft)',
                'primary-ink': 'var(--color-primary-ink)',
                accent: 'var(--color-accent)',
                success: 'var(--color-success)',
                'success-soft': 'var(--color-success-soft)',
                encourage: 'var(--color-encourage)',
                'encourage-soft': 'var(--color-encourage-soft)',
                'encourage-ink': 'var(--color-encourage-ink)',
                learn: 'var(--color-learn)',
                'learn-soft': 'var(--color-learn-soft)',
                'learn-ink': 'var(--color-learn-ink)',
                ink: 'var(--color-ink)',
                muted: 'var(--color-muted)',
            },
            borderRadius: {
                button: 'var(--radius-button)',
                card: 'var(--radius-card)',
            },
            boxShadow: {
                button: 'var(--shadow-button)',
                card: 'var(--shadow-card)',
            },
            fontSize: {
                question: 'var(--text-question)',
                option: 'var(--text-option)',
                title: 'var(--text-title)',
                body: 'var(--text-body)',
            },
        },
    },
    plugins: [],
}
