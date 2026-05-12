import React from 'react';
import './WelcomeScreen.css';

export default function WelcomeScreen({ onEnter }) {
    // La ruta de la imagen en /public
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

                {/* ZONAS INVISIBLES CLICKABLES (OVERLAYS) */}

                {/* Zona 1: Equipo Dorado (Izquierda) */}
                <div
                    className="click-zone zone-left"
                    onClick={onEnter}
                    title="Entrar con Equipo Dorado"
                />

                {/* Zona 2: Equipo Rojo (Derecha) */}
                <div
                    className="click-zone zone-right"
                    onClick={onEnter}
                    title="Entrar con Equipo Rojo"
                />
            </div>

        </div>
    );
}