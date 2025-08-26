import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Grid,
  styled
} from '@mui/material';

const AnimatedSkeleton = styled(Skeleton)(({ theme }) => ({
  '&::after': {
    animationDuration: '1.5s',
  },
}));

interface SkeletonLoaderProps {
  type: 'card' | 'list' | 'dashboard' | 'decision' | 'chart' | 'profile';
  count?: number;
  height?: number | string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type, 
  count = 1, 
  height = 'auto' 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <Card sx={{ height }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AnimatedSkeleton 
                  variant="circular" 
                  width={48} 
                  height={48} 
                  sx={{ mr: 2 }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <AnimatedSkeleton variant="text" width="60%" height={32} />
                  <AnimatedSkeleton variant="text" width="40%" height={20} />
                </Box>
              </Box>
              <AnimatedSkeleton variant="text" width="100%" />
              <AnimatedSkeleton variant="text" width="80%" />
              <AnimatedSkeleton variant="text" width="60%" />
              <Box sx={{ mt: 2 }}>
                <AnimatedSkeleton variant="rectangular" width="100%" height={40} />
              </Box>
            </CardContent>
          </Card>
        );

      case 'list':
        return (
          <Box>
            {[...Array(count)].map((_, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2 }}>
                <AnimatedSkeleton 
                  variant="circular" 
                  width={40} 
                  height={40} 
                  sx={{ mr: 2 }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <AnimatedSkeleton variant="text" width="70%" height={24} />
                  <AnimatedSkeleton variant="text" width="50%" height={16} />
                </Box>
                <AnimatedSkeleton variant="rectangular" width={80} height={32} />
              </Box>
            ))}
          </Box>
        );

      case 'dashboard':
        return (
          <Grid container spacing={3}>
            {/* Stats Cards */}
            {[...Array(4)].map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AnimatedSkeleton 
                        variant="circular" 
                        width={48} 
                        height={48} 
                        sx={{ mr: 2 }}
                      />
                      <Box>
                        <AnimatedSkeleton variant="text" width={80} height={36} />
                        <AnimatedSkeleton variant="text" width={120} height={20} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            
            {/* Charts */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <AnimatedSkeleton variant="text" width={200} height={28} />
                  <AnimatedSkeleton 
                    variant="rectangular" 
                    width="100%" 
                    height={300} 
                    sx={{ mt: 2 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <AnimatedSkeleton variant="text" width={200} height={28} />
                  <AnimatedSkeleton 
                    variant="rectangular" 
                    width="100%" 
                    height={300} 
                    sx={{ mt: 2 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 'decision':
        return (
          <Card sx={{ height }}>
            <CardContent>
              <AnimatedSkeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
              <AnimatedSkeleton variant="text" width="100%" />
              <AnimatedSkeleton variant="text" width="80%" />
              <Box sx={{ my: 3 }}>
                {[...Array(3)].map((_, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <AnimatedSkeleton variant="text" width="40%" height={24} />
                    <AnimatedSkeleton variant="rectangular" width="100%" height={48} sx={{ mt: 1 }} />
                  </Box>
                ))}
              </Box>
              <AnimatedSkeleton variant="rectangular" width="100%" height={56} />
            </CardContent>
          </Card>
        );

      case 'chart':
        return (
          <Card sx={{ height }}>
            <CardContent>
              <AnimatedSkeleton variant="text" width={200} height={28} sx={{ mb: 2 }} />
              <AnimatedSkeleton 
                variant="rectangular" 
                width="100%" 
                height={height === 'auto' ? 300 : height}
              />
            </CardContent>
          </Card>
        );

      case 'profile':
        return (
          <Box>
            {/* Profile Header */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AnimatedSkeleton 
                    variant="circular" 
                    width={80} 
                    height={80} 
                    sx={{ mr: 3 }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <AnimatedSkeleton variant="text" width="50%" height={32} />
                    <AnimatedSkeleton variant="text" width="70%" height={20} />
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <AnimatedSkeleton variant="rectangular" width={80} height={24} />
                      <AnimatedSkeleton variant="rectangular" width={100} height={24} />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            
            {/* Tabs */}
            <Card>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
                  {[...Array(4)].map((_, index) => (
                    <AnimatedSkeleton key={index} variant="rectangular" width={100} height={48} />
                  ))}
                </Box>
              </Box>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <AnimatedSkeleton variant="rectangular" width="100%" height={56} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <AnimatedSkeleton variant="rectangular" width="100%" height={56} />
                  </Grid>
                  <Grid item xs={12}>
                    <AnimatedSkeleton variant="rectangular" width="100%" height={56} />
                  </Grid>
                  <Grid item xs={12}>
                    <AnimatedSkeleton variant="text" width="30%" height={24} sx={{ mb: 1 }} />
                    <AnimatedSkeleton variant="rectangular" width="100%" height={8} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return (
          <AnimatedSkeleton 
            variant="rectangular" 
            width="100%" 
            height={height || 200}
          />
        );
    }
  };

  if (count === 1) {
    return renderSkeleton();
  }

  return (
    <Box>
      {[...Array(count)].map((_, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          {renderSkeleton()}
        </Box>
      ))}
    </Box>
  );
};

// Specialized skeleton components for common use cases
export const DecisionCardSkeleton: React.FC = () => (
  <SkeletonLoader type="decision" />
);

export const DashboardSkeleton: React.FC = () => (
  <SkeletonLoader type="dashboard" />
);

export const ProfileSkeleton: React.FC = () => (
  <SkeletonLoader type="profile" />
);

export const ChartSkeleton: React.FC<{ height?: number | string }> = ({ height }) => (
  <SkeletonLoader type="chart" height={height} />
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <SkeletonLoader type="list" count={count} />
);

export default SkeletonLoader;
