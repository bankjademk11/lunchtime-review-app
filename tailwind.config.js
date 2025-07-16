/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // เพิ่มฟอนต์ Cinzel สำหรับใช้กับคลาส Tailwind 'font-cinzel'
        'cinzel': ['Cinzel', 'serif'], // Cinzel เป็นฟอนต์แบบ serif
        
        // กำหนด Font Family 'lao' ให้ใช้ "Noto Serif Lao"
        'lao': ['"Noto Serif Lao"', 'serif', 'ui-sans-serif', 'system-ui', 'sans-serif'], // ชื่อ Font Family ในนี้ต้องตรงกับ font-family ใน @font-face
      },
    },
  },
  plugins: [],
}