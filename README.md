# CBSE Math Kids App 🎓

A gamified, interactive math learning application designed for CBSE Grade 1 and Grade 2 students. Built with React, Vite, and Tailwind CSS.

## 🌟 Features

- **Grade-wise Syllabus**: Structured curriculum aligned with NCERT/CBSE standards.
  - **Grade 1**: Pre-number concepts, Shapes, Numbers (1-99), Addition/Subtraction, Measurement, Time, Money.
  - **Grade 2**: Numbers (up to 999), Addition/Subtraction (with carry/borrow), Multiplication, Data Handling.
- **Interactive Modules**:
  - **Visual Addition**: Learn counting and addition with emojis.
  - **Visual Fractions**: Understand parts of a whole with interactive pie charts.
- **Quiz Engine**: Fun, gamified quizzes with instant feedback and score tracking.
- **Mobile-First Design**: "Candy Land" themed UI optimized for touch devices.
- **PWA Support**: Installable on devices for offline learning.

## 🛠️ Tech Stack

- **Frontend**: React (v18)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **PWA**: Vite Plugin PWA

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cbse-math-kids-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 📂 Project Structure

```
src/
├── components/         # React components
│   ├── modules/        # Interactive learning modules (VisualAddition, etc.)
│   ├── Layout.jsx      # Main app layout (Mobile frame)
│   ├── QuizEngine.jsx  # Quiz logic and UI
│   └── Syllabus.jsx    # Navigation component
├── data/               # Static data files
│   ├── syllabus.js     # Curriculum structure (Grades -> Topics)
│   └── questions.js    # Question bank for quizzes
├── App.jsx             # Main application entry point
└── main.jsx            # React DOM rendering
```

## 📚 Documentation

Detailed documentation can be found in the `documents/` directory:
- [Implementation Plan](documents/implementation_plan.md)
- [Task List](documents/task.md)
- [Content Sources](documents/content_sources.md) (NCERT/CBSE mapping)

## 📄 License

This project is open-source and available under the MIT License.
