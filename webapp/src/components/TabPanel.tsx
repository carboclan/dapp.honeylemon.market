import React from 'react';
import { Grid } from '@material-ui/core';

interface TabPanelProps {
    children?: React.ReactNode;
    index: any;
    value: any;
}

const TabPanel = ({ children, value, index, ...other }: TabPanelProps) => (
    <Grid item xs={12}
        role="tabpanel"
        hidden={value !== index}
        {...other}
        style={{
            display: 'flex',
            padding: (value !== index) ? '0px' : '8px',
        }}
    >
        {value === index && (children)}
    </Grid>
);

export { TabPanel }
export type { TabPanelProps }