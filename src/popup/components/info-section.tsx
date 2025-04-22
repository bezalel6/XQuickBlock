import { Box, Typography } from '@mui/material';
import React from 'react'

// Create a reusable info section component
const InfoSection: React.FC = () => (
    <Box sx={{ mt: 3 }}>
      <Typography variant="body2" color="text.secondary" paragraph>
        Click the Mute/Block buttons next to usernames to take action.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Hold Ctrl and click to apply to all visible users.
      </Typography>
    </Box>
  );
export default InfoSection  