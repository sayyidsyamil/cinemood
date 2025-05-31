# Cinemood: Movie Emotion Analyzer

Cinemood is a modern web application that analyzes the emotional content of movie plots using AI technology. It provides detailed insights into the emotional journey of movies through beautiful visualizations and comprehensive analysis.

## Features

- Movie plot analysis using AI-powered emotion detection
- Two input methods:
  - Fetch movie plots by title from Wikipedia
  - Input custom movie plots
- Comprehensive analysis results:
  - Scene-by-scene emotion breakdown
  - Emotion distribution visualization
  - Storytelling insights
- Modern, responsive user interface
- Dark mode design

## Tech Stack

### Backend
- FastAPI (Python)
- Transformers (Hugging Face)
- Wikipedia API
- Matplotlib/Seaborn for visualizations

### Frontend
- React with TypeScript
- Material-UI
- Axios for API calls
- React Router for navigation

## Setup Instructions

### Backend Setup

1. Create a Python virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the backend server:
```bash
cd backend
uvicorn main:app --reload
```

The backend server will run on http://localhost:8000

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm start
```

The frontend application will run on http://localhost:3000

## Usage

1. Open http://localhost:3000 in your web browser
2. Choose your preferred input method:
   - Enter a movie title to fetch its plot from Wikipedia
   - Or paste a custom movie plot
3. Click "Analyze" to process the plot
4. View the comprehensive analysis results:
   - Plot summary
   - Emotion distribution graph
   - Storytelling insights
   - Scene-by-scene emotion breakdown

## API Documentation

The backend API documentation is available at http://localhost:8000/docs when the server is running.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 