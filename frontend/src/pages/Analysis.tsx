import React, { useState, ChangeEvent, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActionArea,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  Slide,
  Fade,
  Grow,
  Zoom,
  keyframes,
  StepIconProps,
  useTheme,
  ThemeProvider,
  createTheme,
  Autocomplete,
  Popper,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Movie as MovieIcon,
  Edit as EditIcon,
  SwapHoriz as SwapIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Input as InputIcon,
  Description as DescriptionIcon,
  Psychology as PsychologyIcon,
  BarChart as BarChartIcon,
  TableChart as TableChartIcon,
  GetApp as GetAppIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  KeyboardArrowDown as ScrollDownIcon,
  SentimentSatisfiedAlt,
  Favorite,
  EmojiEmotions,
  SentimentVeryDissatisfied,
  MoodBad,
  Mood,
} from '@mui/icons-material';
import axios from 'axios';
import { styled } from '@mui/material/styles';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  ChartData,
  Scale,
  CoreScaleOptions,
  Tick,
  ScriptableContext,
  ScriptableLineSegmentContext,
  Point,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import CanvasJSReact from '@canvasjs/react-charts';
import MovieSuggestions from '../components/MovieSuggestions';
var CanvasJS = CanvasJSReact.CanvasJS;
var CanvasJSChart = CanvasJSReact.CanvasJSChart;

interface Emotion {
  Scene: number;
  Chunk: string;
  Emotion: string;
  Score: number;
}

interface AnalysisResult {
  plot: string;
  emotions: Emotion[];
  insights: string;
  emotion_totals: { [key: string]: number };
  scene_data: {
    scenes: number[];
    emotions: number[];
    scores: number[];
  };
  emotion_distribution: string;
  csv_data: string;
  pdf_data: string;
  top_emotions: { [key: string]: { percentage: number; count: number; significance: string } };
}

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  ChartTooltip,
  ChartLegend
);

// Sample movie suggestions (you can replace this with actual API data)
const movieSuggestions = [
  { title: 'Inception', year: '2010' },
  { title: 'The Dark Knight', year: '2008' },
  { title: 'Interstellar', year: '2014' },
  { title: 'The Matrix', year: '1999' },
];

// Custom animations
const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const blinkAnimation = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

// Update keyframes for new splitting animation
const buttonSplitAnimation = keyframes`
  0% {
    width: 100%;
    margin-left: 0;
  }
  100% {
    width: calc(50% - 5px);
    margin-left: 10px;
  }
`;

const buttonAppearAnimation = keyframes`
  0% {
    width: 0;
    opacity: 0;
  }
  100% {
    width: calc(50% - 5px);
    opacity: 1;
  }
`;

// Update the TypewriterText component
const TypewriterText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 30 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  // Split text into paragraphs and add proper spacing
  const paragraphs = displayText.split('\n').filter(p => p.trim());

  return (
    <Box sx={{ '& > p:not(:last-child)': { mb: 3 } }}>
      {paragraphs.map((paragraph, index) => (
        <Typography 
          key={index} 
          variant="body1" 
          paragraph={index !== paragraphs.length - 1}
          sx={{ 
            lineHeight: 1.8,
            '&:not(:last-child)': {
              marginBottom: 3,
            }
          }}
        >
          {paragraph}
          {index === paragraphs.length - 1 && (
            <span style={{ 
              display: 'inline-block',
              width: '2px',
              height: '1em',
              backgroundColor: 'currentColor',
              marginLeft: '2px',
              animation: `${blinkAnimation} 1s step-end infinite`,
            }} />
          )}
        </Typography>
      ))}
    </Box>
  );
};

// Styled components with animations
const AnimatedCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[8],
  },
}));

const AnimatedButton = styled(Button)(({ theme }) => ({
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const AnimatedPaper = styled(Paper)(({ theme }) => ({
  transition: 'all 0.3s ease-in-out',
}));

// Custom Step Icon Component
const CustomStepIcon = styled('div')<{ active?: boolean }>(({ theme, active }) => ({
  backgroundColor: active ? theme.palette.common.black : theme.palette.grey[300],
  zIndex: 1,
  color: active ? theme.palette.common.white : theme.palette.grey[700],
  width: active ? 50 : 40,
  height: active ? 50 : 40,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const CustomStepLabel = styled(StepLabel)(({ theme }) => ({
  '& .MuiStepLabel-label': {
    marginTop: theme.spacing(1),
    fontSize: '0.875rem',
    fontWeight: 500,
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
  },
  '& .MuiStepLabel-label.Mui-active': {
    fontSize: '1rem',
    fontWeight: 600,
    color: theme.palette.common.black,
    opacity: 1,
  },
}));

const steps = [
  { label: 'Input & Analysis', icon: <InputIcon /> },
  { label: 'Plot Summary', icon: <DescriptionIcon /> },
  { label: 'Emotion Insights', icon: <PsychologyIcon /> },
  { label: 'Scene Analysis', icon: <TableChartIcon /> },
  { label: 'Emotion Roller Coaster', icon: <BarChartIcon /> },
  { label: 'Download Report', icon: <GetAppIcon /> },
];

const TitleSection = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(4),
  minHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  animation: `${fadeInUp} 1s ease-out`,
}));

const Title = styled(Typography)(({ theme }) => ({
  fontSize: '4.5rem',
  fontWeight: 700,
  marginBottom: theme.spacing(4),
  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  backgroundSize: '200% 200%',
  animation: `${gradientAnimation} 5s ease infinite`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
}));

const Description = styled(Typography)(({ theme }) => ({
  fontSize: '1.4rem',
  color: theme.palette.text.secondary,
  maxWidth: '700px',
  margin: '0 auto',
  lineHeight: 1.8,
  marginBottom: theme.spacing(6),
}));

const StartButton = styled(AnimatedButton)(({ theme }) => ({
  fontSize: '1.2rem',
  padding: theme.spacing(2, 4),
  borderRadius: '30px',
  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  color: 'white',
  '&:hover': {
    background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
    transform: 'scale(1.05)',
  },
}));

const ThemeToggleButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  top: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 1000,
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
  },
  transition: 'all 0.3s ease-in-out',
}));

const TypewriterContainer = styled(Box)(({ theme }) => ({
  '& .MuiTypography-root': {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  '@keyframes blink': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0 },
  },
}));

const SpoilerAlert = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 0, 0, 0.05)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 0, 0, 0.2)'}`,
  marginBottom: theme.spacing(3),
}));

const SpoilerButton = styled(AnimatedButton)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: 'white',
  '&:hover': {
    backgroundColor: theme.palette.error.dark,
  },
  marginTop: theme.spacing(2),
}));

const DownloadButtonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(1),
  position: 'relative',
  height: '60px',
  width: '100%',
  padding: theme.spacing(0, 2),
}));

const MainDownloadButton = styled(AnimatedButton)(({ theme }) => ({
  height: '60px',
  minWidth: '100%',
  marginRight: '50x',
  borderRadius: '30px',
  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  '&.splitting': {
    animation: `${buttonSplitAnimation} 0.5s forwards`,
  },
}));

const SplitDownloadButton = styled(AnimatedButton)(({ theme }) => ({
  height: '60px',
  minWidth: '0',
  borderRadius: '30px',
  opacity: 0,
  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  '&.visible': {
    animation: `${buttonAppearAnimation} 0.5s forwards`,
  },
}));

// Update emotion colors mapping
const emotionColors = {
  joy: '#FFD700',      // Yellow
  surprise: '#FFA500', // Orange
  neutral: '#808080',  // Gray
  fear: '#800080',     // Purple
  sadness: '#4169E1',  // Royal Blue
  anger: '#FF4500',    // Red-Orange
  disgust: '#32CD32',  // Lime Green
};

// Define emotion types
type EmotionValue = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type EmotionLabel = 'Joy' | 'Disgust' | 'Surprise' | 'Neutral' | 'Fear' | 'Sadness' | 'Anger';

// Update emotion labels with proper typing
const emotionLabels: Record<EmotionValue, EmotionLabel> = {
  1: 'Joy',
  2: 'Disgust',
  3: 'Surprise',
  4: 'Neutral',
  5: 'Fear',
  6: 'Sadness',
  7: 'Anger',
} as const;

// Helper function to safely get emotion label
const getEmotionLabel = (value: EmotionValue): EmotionLabel => {
  return emotionLabels[value];
};

interface ChartPoint {
  x: number;
  y: number;
  score: number;
}

// Add helper function for point background color
const getPointBackgroundColor = (point: ChartPoint): string => {
  const emotionValue = point.y as EmotionValue;
  const emotionKey = Object.entries(emotionLabels).find(
    ([_, label]) => label === getEmotionLabel(emotionValue)
  )?.[0];
  const baseColor = emotionColors[emotionKey as keyof typeof emotionColors] || '#808080';
  const opacity = Math.max(0.6, point.score);
  return `${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

// Add new animation keyframes for the chart
const nodePulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 0.7; }
`;

// Add styled component for animated nodes
const AnimatedNode = styled('div')(({ theme }) => ({
  animation: `${nodePulseAnimation} 2s infinite ease-in-out`,
}));

// Add animation keyframes for line drawing
const lineDrawAnimation = keyframes`
  from {
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dashoffset: 0;
  }
`;

// Add after other styled components
const ChartContainer = styled(Box)(({ theme }) => ({
  height: '500px',
  width: '100%',
  marginTop: theme.spacing(2),
  position: 'relative',
  '& .canvasjs-chart-container': {
    height: '100% !important',
  },
  '& .canvasjs-chart-canvas': {
    height: '100% !important',
  },
}));

interface CanvasJSDataPoint {
  x: string;
  y: EmotionValue;
  score: number;
  markerSize?: number;
}

interface CanvasJSEvent {
  dataPoint: CanvasJSDataPoint;
}

interface CanvasJSTooltipEvent {
  entries: Array<{ dataPoint: CanvasJSDataPoint }>;
}

// Add after other styled components
const StepTitle = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontSize: '2.5rem',
  fontWeight: 700,
  marginBottom: theme.spacing(4),
  color: theme.palette.text.primary,
  textTransform: 'capitalize',
  [theme.breakpoints.down('sm')]: {
    fontSize: '2rem',
  },
}));

// Add after other styled components
const FloatingScrollButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  boxShadow: theme.shadows[4],
  opacity: 0,
  visibility: 'hidden',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
  '&.visible': {
    opacity: 1,
    visibility: 'visible',
  },
  zIndex: 1000,
}));

// Add after other interfaces
interface MovieSuggestion {
  title: string;
  year: string;
}

// Add after other constants
const movieList: MovieSuggestion[] = [
  { title: 'The Empire Strikes Back', year: '1980' },
  { title: 'Raiders of the Lost Ark', year: '1981' },
  { title: 'E.T. the Extra-Terrestrial', year: '1982' },
  { title: 'Scarface', year: '1983' },
  { title: 'The Terminator', year: '1984' },
  { title: 'Back to the Future', year: '1985' },
  { title: 'Aliens', year: '1986' },
  { title: 'The Princess Bride', year: '1987' },
  { title: 'Die Hard', year: '1988' },
  { title: 'Batman', year: '1989' },
  { title: 'Goodfellas', year: '1990' },
  { title: 'The Silence of the Lambs', year: '1991' },
  { title: 'Reservoir Dogs', year: '1992' },
  { title: 'Jurassic Park', year: '1993' },
  { title: 'Pulp Fiction', year: '1994' },
  { title: 'Braveheart', year: '1995' },
  { title: 'Fargo', year: '1996' },
  { title: 'Titanic', year: '1997' },
  { title: 'The Truman Show', year: '1998' },
  { title: 'The Matrix', year: '1999' },
  { title: 'Gladiator', year: '2000' },
  { title: 'The Lord of the Rings: The Fellowship of the Ring', year: '2001' },
  { title: 'Spider-Man', year: '2002' },
  { title: 'Finding Nemo', year: '2003' },
  { title: 'The Incredibles', year: '2004' },
  { title: 'Batman Begins', year: '2005' },
  { title: 'The Departed', year: '2006' },
  { title: 'No Country for Old Men', year: '2007' },
  { title: 'The Dark Knight', year: '2008' },
  { title: 'Avatar', year: '2009' },
  { title: 'Inception', year: '2010' },
  { title: 'The Social Network', year: '2010' },
  { title: 'The Avengers', year: '2012' },
  { title: 'Frozen', year: '2013' },
  { title: 'Interstellar', year: '2014' },
  { title: 'Mad Max: Fury Road', year: '2015' },
  { title: 'La La Land', year: '2016' },
  { title: 'Get Out', year: '2017' },
  { title: 'Avengers: Infinity War', year: '2018' },
  { title: 'Parasite', year: '2019' },
  { title: 'Tenet', year: '2020' },
  { title: 'Dune', year: '2021' },
  { title: 'Everything Everywhere All at Once', year: '2022' },
  { title: 'Top Gun: Maverick', year: '2022' },
  { title: 'Oppenheimer', year: '2023' },
  { title: 'Barbie', year: '2023' },
  { title: 'Dune: Part Two', year: '2024' },
];

// Update the SearchPopper styled component
const SearchPopper = styled(Popper)(({ theme }) => ({
  '& .MuiAutocomplete-paper': {
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[4],
    maxHeight: '300px',
    '& .MuiAutocomplete-option': {
      padding: theme.spacing(1, 2),
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    },
    // Hide scrollbar for Chrome, Safari and Opera
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    // Hide scrollbar for IE, Edge and Firefox
    '-ms-overflow-style': 'none',  /* IE and Edge */
    'scrollbar-width': 'none',  /* Firefox */
  },
  // Target the listbox element directly
  '& .MuiAutocomplete-listbox': {
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    '-ms-overflow-style': 'none',  /* IE and Edge */
    'scrollbar-width': 'none',  /* Firefox */
  },
  // Target any scrollable container within the popper
  '& *': {
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    '-ms-overflow-style': 'none',  /* IE and Edge */
    'scrollbar-width': 'none',  /* Firefox */
  },
}));

// Add EmotionIcon component
const EmotionIcon: React.FC<{ emotion: string; size?: number }> = ({ emotion, size = 40 }) => {
  const getIconPath = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'joy':
        return '/happy.svg';
      case 'anger':
        return '/angry.svg';
      case 'sadness':
        return '/sad.svg';
      case 'fear':
        return '/fear.svg';
      case 'surprise':
        return '/surprised.svg';
      case 'disgust':
        return '/disgust.svg';
      case 'neutral':
        return '/neutral-24px.svg';
      default:
        return '/neutral-24px.svg';
    }
  };

  return (
    <Box
      component="img"
      src={getIconPath(emotion)}
      alt={`${emotion} icon`}
      sx={{
        width: size,
        height: size,
        filter: `drop-shadow(0 0 2px ${emotionColors[emotion as keyof typeof emotionColors] || '#808080'})`,
        '& path': {
          fill: emotionColors[emotion as keyof typeof emotionColors] || '#808080',
        },
      }}
    />
  );
};

const Analysis: React.FC = () => {
  const [inputMode, setInputMode] = useState<'movie' | 'custom'>('movie');
  const [movieTitle, setMovieTitle] = useState('');
  const [customPlot, setCustomPlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [showLanding, setShowLanding] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [showSplitButtons, setShowSplitButtons] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [movieInput, setMovieInput] = useState<string>('');

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      ...(darkMode
        ? {
            background: {
              default: '#121212',
              paper: '#1e1e1e',
            },
            text: {
              primary: '#ffffff',
              secondary: 'rgba(255, 255, 255, 0.7)',
            },
          }
        : {
            background: {
              default: '#ffffff',
              paper: '#f5f5f5',
            },
            text: {
              primary: '#000000',
              secondary: 'rgba(0, 0, 0, 0.7)',
            },
          }),
    },
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleAnalyze = async () => {
    if (!movieTitle && !customPlot) {
      setError('Please provide either a movie title or a custom plot');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post<AnalysisResult>('http://localhost:8000/api/analyze', {
        title: movieTitle || undefined,
        custom_plot: customPlot || undefined,
      });
      setResult(response.data);
      setActiveStep(1); // Move to plot summary after analysis
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (data: string, filename: string, mimeType: string) => {
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  const handleMovieSelect = (title: string) => {
    setMovieTitle(title);
    setMovieInput(title);
    setInputMode('movie');
    
  };

  const handleNext = () => {
    setSlideDirection('right');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setSlideDirection('left');
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setSlideDirection('left');
    setActiveStep(0);
    setResult(null);
    setMovieTitle('');
    setCustomPlot('');
  };

  const handleStart = () => {
    setShowLanding(false);
  };

  const filterMovies = (input: string) => {
    if (!input) return [];
    
    const searchTerm = input.toLowerCase();
    return movieList.filter(movie => 
      movie.title.toLowerCase().includes(searchTerm) ||
      movie.year.includes(searchTerm)
    );
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Zoom in={true} timeout={500}>
            <Box>
              <StepTitle>
                Input & Analysis
              </StepTitle>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tabs
                  value={inputMode}
                  onChange={(_, newValue) => setInputMode(newValue)}
                  sx={{ flexGrow: 1 }}
                >
                  <Tab
                    value="movie"
                    label="Movie Title"
                    icon={<MovieIcon />}
                    iconPosition="start"
                  />
                  <Tab
                    value="custom"
                    label="Custom Plot"
                    icon={<EditIcon />}
                    iconPosition="start"
                  />
                </Tabs>
                <Tooltip title="Switch Input Mode">
                  <IconButton onClick={() => setInputMode(inputMode === 'movie' ? 'custom' : 'movie')}>
                    <SwapIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <Grow in={true} timeout={1000}>
                <Box>
                  {inputMode === 'movie' ? (
                    <Autocomplete
                      freeSolo
                      options={movieList}
                      getOptionLabel={(option) => 
                        typeof option === 'string' ? option : `${option.title} (${option.year})`
                      }
                      filterOptions={(options, state) => {
                        const inputValue = state.inputValue.toLowerCase();
                        return options.filter(option =>
                          option.title.toLowerCase().includes(inputValue) ||
                          option.year.includes(inputValue)
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          label="Enter movie title"
                          value={movieInput}
                          onChange={(e) => {
                            setMovieInput(e.target.value);
                            setMovieTitle(e.target.value);
                          }}
                          margin="normal"
                          disabled={!!customPlot}
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Typography>{option.title}</Typography>
                            <Typography color="text.secondary">{option.year}</Typography>
                          </Box>
                        </li>
                      )}
                      PopperComponent={SearchPopper}
                      onChange={(_, newValue) => {
                        if (typeof newValue === 'string') {
                          setMovieTitle(newValue);
                          setMovieInput(newValue);
                        } else if (newValue) {
                          setMovieTitle(newValue.title);
                          setMovieInput(newValue.title);
                        }
                      }}
                      onInputChange={(_, newInputValue) => {
                        setMovieInput(newInputValue);
                        setMovieTitle(newInputValue);
                      }}
                      sx={{ mb: 3 }}
                    />
                  ) : (
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Enter custom plot"
                      value={customPlot}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomPlot(e.target.value)}
                      margin="normal"
                      disabled={!!movieTitle}
                      sx={{ mb: 3 }}
                    />
                  )}
                </Box>
              </Grow>

              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Suggested Movies
              </Typography>
              <MovieSuggestions 
                movies={movieSuggestions} 
                onSelect={handleMovieSelect} 
              />

              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <AnimatedButton
                  variant="contained"
                  size="large"
                  onClick={handleAnalyze}
                  disabled={loading}
                  sx={{ minWidth: 200 }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ animation: `${pulseAnimation} 1s infinite` }} />
                  ) : (
                    'Analyze'
                  )}
                </AnimatedButton>
              </Box>
            </Box>
          </Zoom>
        );

      case 1:
        return (
          <Slide direction="right" in={true} mountOnEnter unmountOnExit>
            <Box>
              <StepTitle>
                Plot Summary
              </StepTitle>
              <Fade in={true} timeout={1000}>
                {!result?.plot ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box>
                    {!showSpoiler ? (
                      <SpoilerAlert>
                        <Typography variant="h6" color="error" gutterBottom>
                          ⚠️ Spoiler Alert
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          This plot summary may contain spoilers for the movie.
                          Are you sure you want to proceed?
                        </Typography>
                        <SpoilerButton
                          variant="contained"
                          onClick={() => setShowSpoiler(true)}
                          sx={{ mt: 2 }}
                        >
                          Show Plot Summary
                        </SpoilerButton>
                      </SpoilerAlert>
                    ) : (
                      <TypewriterContainer>
                        <TypewriterText text={result.plot} speed={5} />
                      </TypewriterContainer>
                    )}
                  </Box>
                )}
              </Fade>
            </Box>
          </Slide>
        );

      case 2:
        return (
          <Slide direction="right" in={true} mountOnEnter unmountOnExit>
            <Box>
              <StepTitle>
                Emotion Insights
              </StepTitle>
              <Fade in={true} timeout={1000}>
                <Box>
                  {result?.top_emotions && (
                    <Box sx={{ mb: 4 }}>
                      <Grid container spacing={3}>
                        {Object.entries(result.top_emotions).map(([emotion, data], index) => (
                          <Grid item xs={12} key={emotion}>
                            <Card 
                              elevation={0}
                              sx={{ 
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                transition: 'transform 0.2s',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                },
                              }}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                  <EmotionIcon emotion={emotion} />
                                  <Typography variant="h6" sx={{ ml: 2, textTransform: 'capitalize' }}>
                                    {emotion}
                                  </Typography>
                                  <Box sx={{ flexGrow: 1 }} />
                                  <Typography 
                                    variant="h6" 
                                    sx={{ 
                                      color: emotionColors[emotion as keyof typeof emotionColors] || 'primary.main',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {data.percentage}%
                                  </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  Appears in {data.count} scenes
                                </Typography>
                                <Typography variant="body1">
                                  {data.significance}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                  
                  {result?.emotion_totals && (
                    <Box sx={{ mt: 4, height: '400px' }}>
                      <Bar
                        data={{
                          labels: Object.keys(result.emotion_totals).filter(emotion => emotion !== 'neutral'),
                          datasets: [{
                            label: 'Emotion Distribution (%)',
                            data: Object.entries(result.emotion_totals)
                              .filter(([emotion]) => emotion !== 'neutral')
                              .map(([_, value]) => value),
                            backgroundColor: Object.keys(result.emotion_totals)
                              .filter(emotion => emotion !== 'neutral')
                              .map(emotion => emotionColors[emotion as keyof typeof emotionColors] || '#808080'),
                            borderColor: Object.keys(result.emotion_totals)
                              .filter(emotion => emotion !== 'neutral')
                              .map(emotion => emotionColors[emotion as keyof typeof emotionColors] || '#808080'),
                            borderWidth: 1,
                          }],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            title: {
                              display: true,
                              text: 'Emotion Distribution Across Scenes',
                              font: {
                                size: 16,
                              },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Percentage (%)',
                              },
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Emotion',
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Fade>
            </Box>
          </Slide>
        );

      case 3:
        return (
          <Slide direction="right" in={true} mountOnEnter unmountOnExit>
            <Box>
              <StepTitle>
                Scene Analysis
              </StepTitle>
              <Fade in={true} timeout={1000}>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Scene</TableCell>
                        <TableCell>Text</TableCell>
                        <TableCell>Emotion</TableCell>
                        <TableCell align="right">Score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result?.emotions.map((emotion, index) => (
                        <Grow
                          key={index}
                          in={true}
                          timeout={1000}
                          style={{ transitionDelay: `${index * 100}ms` }}
                        >
                          <TableRow>
                            <TableCell>{emotion.Scene}</TableCell>
                            <TableCell>{emotion.Chunk}</TableCell>
                            <TableCell>{emotion.Emotion}</TableCell>
                            <TableCell align="right">
                              {(emotion.Score * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        </Grow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Fade>
            </Box>
          </Slide>
        );

      case 4:
        return (
          <Slide direction="right" in={true} mountOnEnter unmountOnExit>
            <Box>
              <StepTitle>
                Emotion Roller Coaster
              </StepTitle>
              <Box sx={{ height: '500px', mt: 2 }}>
                {result?.scene_data ? (
                  <ChartContainer>
                    <CanvasJSChart
                      options={{
                        animationEnabled: true,
                        animationDuration: 2000,
                        animationEasing: "easeInOutQuart",
                        theme: darkMode ? "dark2" : "light2",
                        backgroundColor: "transparent",
                        axisX: {
                          title: "Scene",
                          gridColor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                          labelFontColor: darkMode ? "#fff" : "#666",
                          titleFontColor: darkMode ? "#fff" : "#666",
                          lineColor: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
                        },
                        axisY: {
                          title: "Emotion",
                          minimum: 0.5,
                          maximum: 7.5,
                          interval: 1,
                          gridColor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                          labelFontColor: darkMode ? "#fff" : "#666",
                          titleFontColor: darkMode ? "#fff" : "#666",
                          lineColor: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
                          labelFormatter: (e: { value: number }) => {
                            if (e.value in emotionLabels) {
                              return getEmotionLabel(e.value as EmotionValue).toString();
                            }
                            return e.value.toString();
                          },
                        },
                        toolTip: {
                          backgroundColor: darkMode ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)",
                          borderColor: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
                          fontColor: darkMode ? "#fff" : "#000",
                          cornerRadius: 4,
                          contentFormatter: (e: CanvasJSTooltipEvent) => {
                            const point = e.entries[0].dataPoint;
                            const emotionValue = point.y;
                            const score = point.score;
                            return `${getEmotionLabel(emotionValue)}: ${(score * 100).toFixed(1)}%`;
                          },
                        },
                        data: [{
                          type: "spline",
                          lineColor: darkMode ? "#2196F3" : "#1976D2",
                          lineThickness: 3,
                          markerType: "circle",
                          markerSize: (e: CanvasJSEvent) => e.dataPoint.score > 0.8 ? 12 : 8,
                          markerColor: (e: CanvasJSEvent) => {
                            const emotionValue = e.dataPoint.y;
                            const emotionKey = Object.entries(emotionLabels).find(
                              ([_, label]) => label === getEmotionLabel(emotionValue)
                            )?.[0];
                            return emotionColors[emotionKey as keyof typeof emotionColors] || '#808080';
                          },
                          markerBorderColor: "#fff",
                          markerBorderThickness: 2,
                          dataPoints: result.scene_data.emotions.map((emotion, index) => ({
                            x: result.scene_data.scenes[index],
                            y: emotion as EmotionValue,
                            score: result.scene_data.scores[index],
                            markerSize: result.scene_data.scores[index] > 0.8 ? 12 : 8,
                          })),
                        }],
                      }}
                    />
                  </ChartContainer>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100%' 
                  }}>
                    <Typography variant="body1" color="text.secondary">
                      No emotion data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Slide>
        );

      case 5:
         return (
          <Slide direction="right" in={true} mountOnEnter unmountOnExit>
            <Box>
              <StepTitle>
                Download Results
              </StepTitle>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 1, 
                position: 'relative', 
                height: '60px', 
                width: '100%', 
                maxWidth: '600px',
                margin: '0 auto',
                p: '0 16px' 
              }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownload(result?.csv_data || '', 'analysis.csv', 'text/csv')}
                  sx={{
                    height: '60px',
                    minWidth: showSplitButtons ? 'calc(50% - 8px)' : 0,
                    maxWidth: showSplitButtons ? 'calc(50% - 8px)' : 0,
                    borderRadius: '30px',
                    opacity: showSplitButtons ? 1 : 0,
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    bgcolor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  }}
                >
                  CSV Report
                </Button>
                <Button
        variant="contained"
        startIcon={<DownloadIcon />}
        onClick={
          showSplitButtons
            ? () => handleDownload(result?.pdf_data || '', 'analysis.pdf', 'application/pdf') //  <-- MODIFIED HERE
            : () => setShowSplitButtons(true)
        }
        sx={{
          height: '60px',
          minWidth: showSplitButtons ? 'calc(50% - 8px)' : '300px',
          maxWidth: showSplitButtons ? 'calc(50% - 8px)' : '300px',
          borderRadius: '30px',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          bgcolor: showSplitButtons ? 'secondary.main' : 'primary.main',
          '&:hover': {
            bgcolor: showSplitButtons ? 'secondary.dark' : 'primary.dark',
          },
          ...(showSplitButtons && {
            marginLeft: '8px', // This only applies when split
          }),
        }}
      >
        {showSplitButtons ? 'PDF Report' : 'Download'}
      </Button>
              </Box>
            </Box>
          </Slide>
        );

      default:
        return null;
    }
  };

  const renderContent = () => {
    if (showLanding) {
      return (
        <Container maxWidth="lg">
          <ThemeToggleButton onClick={toggleDarkMode}>
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </ThemeToggleButton>
          <TitleSection>
            <Title>Cinemood</Title>
            <Description>
              Discover the emotional journey of your favorite movies through AI-powered analysis.
              Uncover the hidden patterns in storytelling and character development.
              Experience a new way of understanding cinema through the lens of emotions.
            </Description>
            <StartButton
              variant="contained"
              size="large"
              onClick={handleStart}
            >
              Let's Start
            </StartButton>
          </TitleSection>
        </Container>
      );
    }

    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <ThemeToggleButton onClick={toggleDarkMode}>
          {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </ThemeToggleButton>
        <AnimatedPaper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel 
            sx={{ 
              mb: 4,
              '& .MuiStepConnector-line': {
                borderColor: 'grey.300',
              },
            }}
          >
            {steps.map((step, index) => (
              <Step key={step.label}>
                <CustomStepLabel
                  StepIconComponent={() => (
                    <CustomStepIcon active={index === activeStep}>
                      {step.icon}
                    </CustomStepIcon>
                  )}
                >
                  {step.label}
                </CustomStepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Fade in={true}>
              <Alert severity="error" sx={{ mb: 4 }}>
                {error}
              </Alert>
            </Fade>
          )}

          <Box sx={{ minHeight: '400px' }}>
            {renderStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <AnimatedButton
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{ 
                bgcolor: activeStep === 0 ? 'grey.300' : 'black',
                color: 'white',
                '&:hover': {
                  bgcolor: activeStep === 0 ? 'grey.300' : 'grey.800',
                },
              }}
            >
              Back
            </AnimatedButton>
            {activeStep === steps.length - 1 ? (
              <AnimatedButton
                variant="contained"
                startIcon={<ArrowBackIcon />}
                onClick={handleReset}
                sx={{ 
                  bgcolor: 'black',
                  '&:hover': {
                    bgcolor: 'grey.800',
                  },
                }}
              >
                Start Over
              </AnimatedButton>
            ) : (
              <AnimatedButton
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={handleNext}
                disabled={!result || activeStep === steps.length - 1}
                sx={{ 
                  bgcolor: !result || activeStep === steps.length - 1 ? 'grey.300' : 'black',
                  '&:hover': {
                    bgcolor: !result || activeStep === steps.length - 1 ? 'grey.300' : 'grey.800',
                  },
                }}
              >
                Next
              </AnimatedButton>
            )}
          </Box>
        </AnimatedPaper>
      </Container>
    );
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = document.documentElement.clientHeight;
      
      // Show button when user has scrolled up and there's more content below
      setShowScrollButton(scrollTop < scrollHeight - clientHeight - 100);
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  const renderScrollButton = () => (
    <FloatingScrollButton
      className={showScrollButton ? 'visible' : ''}
      onClick={scrollToBottom}
      size="large"
      aria-label="scroll to bottom"
    >
      <ScrollDownIcon fontSize="large" />
    </FloatingScrollButton>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        bgcolor: 'background.default', 
        minHeight: '100vh',
        color: 'text.primary',
        transition: 'all 0.3s ease-in-out'
      }}>
        {renderContent()}
        {renderScrollButton()}
      </Box>
    </ThemeProvider>
  );
};

export default Analysis; 