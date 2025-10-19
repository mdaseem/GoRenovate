import React from 'react';
import './LiveBackground.css';

function LiveBackground() {
  return (
    <div className="video-container">
      <video autoPlay loop muted className="background-video" >
        <source src='Gradient_green.mp4' type="video/mp4" />
      </video>
    </div>
  );
}

export default LiveBackground;
