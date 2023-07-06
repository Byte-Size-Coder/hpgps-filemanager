import React from 'react';

import '../../../styles/app.css';

const Popup = ({open, children}) => {
    return (open) ? (
        <div className="hpgps-popup">
            <div className="hpgps-popup-inner">
                {children}
            </div>
        </div>
    ) : ''
};

export default Popup;