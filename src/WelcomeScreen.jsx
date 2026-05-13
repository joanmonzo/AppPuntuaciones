import React from 'react';
import './WelcomeScreen.css';

export default function WelcomeScreen({ onEnter }) {
    const imageSelector = '/images/SELECCIÓN DE EQUIPOS PANTALLA.jpg';

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
                    onClick={onEnter}
                    title="Entrar con Equipo Carabassa Slice Fockers"
                />

                <div
                    className="click-zone-vertical zone-right-vertical"
                    onClick={onEnter}
                    title="Entrar con Equipo Carajillos Voladores"
                />
            </div>

        </div>
    );
}