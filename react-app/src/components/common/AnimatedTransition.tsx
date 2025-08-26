import React, { ReactNode } from 'react';
import { Box, Fade, Slide, Grow, Zoom, styled } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';

interface AnimatedTransitionProps {
  children: ReactNode;
  type?: 'fade' | 'slide' | 'grow' | 'zoom' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight';
  duration?: number;
  delay?: number;
  in?: boolean;
  direction?: 'up' | 'down' | 'left' | 'right';
  easing?: string;
}

const AnimatedBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'animationType'
})<{ animationType?: string }>(({ theme, animationType }) => ({
  transition: 'all 0.3s ease-in-out',
  
  ...(animationType === 'hover' && {
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
    },
  }),
  
  ...(animationType === 'float' && {
    animation: 'float 3s ease-in-out infinite',
    '@keyframes float': {
      '0%, 100%': {
        transform: 'translateY(0)',
      },
      '50%': {
        transform: 'translateY(-10px)',
      },
    },
  }),
  
  ...(animationType === 'pulse' && {
    animation: 'pulse 2s ease-in-out infinite',
    '@keyframes pulse': {
      '0%, 100%': {
        opacity: 1,
      },
      '50%': {
        opacity: 0.7,
      },
    },
  }),
  
  ...(animationType === 'bounce' && {
    animation: 'bounce 1s ease-in-out',
    '@keyframes bounce': {
      '0%, 20%, 50%, 80%, 100%': {
        transform: 'translateY(0)',
      },
      '40%': {
        transform: 'translateY(-10px)',
      },
      '60%': {
        transform: 'translateY(-5px)',
      },
    },
  }),
  
  ...(animationType === 'shake' && {
    animation: 'shake 0.5s ease-in-out',
    '@keyframes shake': {
      '0%, 100%': {
        transform: 'translateX(0)',
      },
      '25%': {
        transform: 'translateX(-5px)',
      },
      '75%': {
        transform: 'translateX(5px)',
      },
    },
  }),
}));

const AnimatedTransition: React.FC<AnimatedTransitionProps> = ({
  children,
  type = 'fade',
  duration = 300,
  delay = 0,
  in: inProp = true,
  direction = 'up',
  easing = 'ease-in-out',
}) => {
  const transitionProps: Partial<TransitionProps> = {
    timeout: duration + delay,
    easing: {
      enter: easing,
      exit: easing,
    },
    style: {
      transitionDelay: `${delay}ms`,
    },
  };

  switch (type) {
    case 'fade':
      return (
        <Fade in={inProp} {...transitionProps}>
          <Box>{children}</Box>
        </Fade>
      );

    case 'slide':
    case 'slideUp':
      return (
        <Slide direction="up" in={inProp} {...transitionProps}>
          <Box>{children}</Box>
        </Slide>
      );

    case 'slideDown':
      return (
        <Slide direction="down" in={inProp} {...transitionProps}>
          <Box>{children}</Box>
        </Slide>
      );

    case 'slideLeft':
      return (
        <Slide direction="left" in={inProp} {...transitionProps}>
          <Box>{children}</Box>
        </Slide>
      );

    case 'slideRight':
      return (
        <Slide direction="right" in={inProp} {...transitionProps}>
          <Box>{children}</Box>
        </Slide>
      );

    case 'grow':
      return (
        <Grow in={inProp} {...transitionProps}>
          <Box>{children}</Box>
        </Grow>
      );

    case 'zoom':
      return (
        <Zoom in={inProp} {...transitionProps}>
          <Box>{children}</Box>
        </Zoom>
      );

    default:
      return <Box>{children}</Box>;
  }
};

// Specialized animated components
export const FadeInBox: React.FC<{ children: ReactNode; delay?: number }> = ({ 
  children, 
  delay = 0 
}) => (
  <AnimatedTransition type="fade" delay={delay}>
    {children}
  </AnimatedTransition>
);

export const SlideInBox: React.FC<{ 
  children: ReactNode; 
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
}> = ({ children, direction = 'up', delay = 0 }) => (
  <AnimatedTransition type={`slide${direction.charAt(0).toUpperCase() + direction.slice(1)}` as any} delay={delay}>
    {children}
  </AnimatedTransition>
);

export const HoverBox: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AnimatedBox animationType="hover">
    {children}
  </AnimatedBox>
);

export const FloatingBox: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AnimatedBox animationType="float">
    {children}
  </AnimatedBox>
);

export const PulsingBox: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AnimatedBox animationType="pulse">
    {children}
  </AnimatedBox>
);

export const BounceBox: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AnimatedBox animationType="bounce">
    {children}
  </AnimatedBox>
);

// Staggered animation for lists
export const StaggeredFadeIn: React.FC<{ 
  children: ReactNode[];
  delay?: number;
  stagger?: number;
}> = ({ children, delay = 0, stagger = 100 }) => (
  <>
    {React.Children.map(children, (child, index) => (
      <FadeInBox delay={delay + index * stagger}>
        {child}
      </FadeInBox>
    ))}
  </>
);

// Page transition wrapper
export const PageTransition: React.FC<{ children: ReactNode }> = ({ children }) => (
  <FadeInBox delay={50}>
    <SlideInBox direction="up" delay={100}>
      {children}
    </SlideInBox>
  </FadeInBox>
);

export default AnimatedTransition;
