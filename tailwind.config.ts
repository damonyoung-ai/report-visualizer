import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0b1020',
        slate: '#1f2937',
        mist: '#f5f7fb',
        accent: '#1f6feb',
        accent2: '#12b981',
        warning: '#f59e0b'
      }
    }
  },
  plugins: [],
};

export default config;
