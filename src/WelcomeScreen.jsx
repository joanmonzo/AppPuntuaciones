import React from 'react';
import './WelcomeScreen.css';

export default function WelcomeScreen({ onEnter }) {
    const imageSelector = '/images/VERTICAL INICIO J.png';

    return (
        <div className="welcome-overlay">
            <div className="welcome-header-vertical">
            </div>

            <div className="image-selector-container-vertical">
                <img
                    src={imageSelector}
                    alt="Selección de Equipos"
                    className="selector-image-vertical"
                />

                <div
                    className="click-zone-vertical zone-left-vertical"
                    onClick={() => onEnter("CARABASSA SLICE FOCKERS")}
                    title="Entrar con Carabassa"
                />

                <div
                    className="click-zone-vertical zone-right-vertical"
                    onClick={() => onEnter("CARAJILLOS VOLADORES")}
                    title="Entrar con Carajillos"
                />
            </div>
        </div>
    );
}