import { Button, Link } from '@mui/material';
import { isProd } from 'lib/environment';
import React from 'react';
import ToggleSwitch from './toggle-switch';
import { PropsOf } from '@emotion/react';

/**
 * A component that displays the current environment (dev/prod) in the popup
 */
const EnvironmentIndicator: React.FC<PropsOf<typeof ToggleSwitch>> = props => {
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
    opacity: 1,
  };

  return (
    <div style={styles}>
      <>
        {isProd ? 'PROD' : 'DEV'}
        {!isProd && <Link href={'./'}>Open local examples</Link>}
        {!isProd && <ToggleSwitch {...props} />}
      </>
    </div>
  );
};

export default EnvironmentIndicator;
