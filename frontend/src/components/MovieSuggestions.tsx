import React from 'react';
import { Box, Card, CardActionArea, CardContent, Typography, styled, keyframes } from '@mui/material';

const horizontalScrollAnimation = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
`;

const MovieCardContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100px',
    zIndex: 1,
    pointerEvents: 'none',
  },
  '&::before': {
    left: 0,
    background: `linear-gradient(to right, ${theme.palette.background.default} 0%, transparent 100%)`,
  },
  '&::after': {
    right: 0,
    background: `linear-gradient(to left, ${theme.palette.background.default} 0%, transparent 100%)`,
  },
}));

const MovieCardWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  animation: `${horizontalScrollAnimation} 30s linear infinite`,
  '&:hover': {
    animationPlayState: 'paused',
  },
  '& > *': {
    flexShrink: 0,
  },
}));

const MovieCard = styled(Card)(({ theme }) => ({
  width: '200px',
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px) scale(1.02)',
    boxShadow: theme.shadows[8],
    '& .movie-year': {
      color: theme.palette.primary.main,
    },
  },
}));

interface Movie {
  title: string;
  year: string;
}

interface MovieSuggestionsProps {
  movies: Movie[];
  onSelect: (title: string) => void;
}

const MovieSuggestions: React.FC<MovieSuggestionsProps> = ({ movies, onSelect }) => {
  // Create a longer array by repeating the movies multiple times to ensure smooth scrolling
  const repeatedMovies = [...movies, ...movies, ...movies, ...movies];

  return (
    <MovieCardContainer>
      <MovieCardWrapper>
        {repeatedMovies.map((movie, index) => (
          <MovieCard key={`${movie.title}-${index}`}>
            <CardActionArea onClick={() => onSelect(movie.title)}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {movie.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  className="movie-year"
                  sx={{ transition: 'color 0.3s ease-in-out' }}
                >
                  {movie.year}
                </Typography>
              </CardContent>
            </CardActionArea>
          </MovieCard>
        ))}
      </MovieCardWrapper>
    </MovieCardContainer>
  );
};

export default MovieSuggestions; 