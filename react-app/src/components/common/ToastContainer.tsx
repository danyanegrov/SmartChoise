import React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Button,
  Box,
  styled
} from '@mui/material';
import { useUIStore } from '@/store/useUIStore';

const ToastWrapper = styled(Box)({
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  maxWidth: 400,
});

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <ToastWrapper>
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ position: 'relative' }}
        >
          <Alert
            severity={toast.type}
            onClose={() => removeToast(toast.id)}
            action={
              toast.action && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={toast.action.onClick}
                >
                  {toast.action.label}
                </Button>
              )
            }
            sx={{
              width: '100%',
              alignItems: 'flex-start',
              '& .MuiAlert-message': {
                paddingTop: 0.5,
              },
            }}
          >
            <AlertTitle sx={{ marginBottom: toast.message ? 0.5 : 0 }}>
              {toast.title}
            </AlertTitle>
            {toast.message && (
              <div>{toast.message}</div>
            )}
          </Alert>
        </Snackbar>
      ))}
    </ToastWrapper>
  );
};

export default ToastContainer;
