import { Button } from '@mui/material';
import React from 'react';

/**
 * A component that displays the current environment (dev/prod) in the popup
 */
const EnvironmentIndicator: React.FC = () => {
  const environment = process.env.NODE_ENV || 'development';
  const isProd = environment === 'production';

  const styles: React.CSSProperties = {
    position: 'fixed',
    bottom: '8px',
    right: '8px',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 'bold',
    borderRadius: '4px',
    color: '#fff',
    backgroundColor: isProd ? '#2e7d32' : '#f57c00', // Green for prod, orange for dev
    zIndex: 9999,
    opacity: 0.9,
  };

  return (
    <div style={styles}>
      <>
        {isProd ? 'PROD' : 'DEV'}
        {!isProd && <Button>Open local examples</Button>}
      </>
    </div>
  );
};

export default EnvironmentIndicator;
