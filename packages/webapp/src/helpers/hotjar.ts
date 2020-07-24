import { hotjar } from 'react-hotjar';

export const initHotjar = () => {
    hotjar.initialize(Number(process.env.REACT_APP_HOTJAR_ID), 6)
};