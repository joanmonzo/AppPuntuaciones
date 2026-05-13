import React from 'react';
import './WelcomeScreen.css';

export default function WelcomeScreen({ onEnter }) {
    const imageSelector = '/images/SELECCIÓN DE EQUIPOS PANTALLA.png';

    return (
        <div className="welcome-overlay">

            <p className="welcome-instruction">Pulsa sobre tu equipo para entrar</p>

            <div className="image-selector-container">
                <img
                    src={imageSelector}
                    alt="Selección de Equipos"
                    className="selector-image"
                />

                <div
                    className="click-zone zone-left"
                    onClick={onEnter}
                    title="Entrar con Equipo Dorado"
                />

                <div
                    className="click-zone zone-right"
                    onClick={onEnter}
                    title="Entrar con Equipo Rojo"
                />
            </div>

        </div>
    );
}