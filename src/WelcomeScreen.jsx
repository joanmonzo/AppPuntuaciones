import React from 'react';
import './WelcomeScreen.css'; // Asegúrate de actualizar también el CSS

export default function WelcomeScreen({ onEnter }) {
    // La ruta de la imagen en /public
    const imageSelector = '/images/SELECCIÓN DE EQUIPOS PANTALLA.png';

    return (
        <div className="welcome-overlay">
            <div className="welcome-frame">
                <p className="welcome-instruction">Pulsa sobre tu equipo para entrar</p>

                <div className="image-selector-container">
                    <img
                        src={imageSelector}
                        alt="Selección de Equipos"
                        className="selector-image"
                    />

                    {/* ZONAS INVISIBLES CLICKABLES (OVERLAYS) */}

                    {/* Zona 1: Equipo Carabassa Slice (Izquierda) */}
                    <div
                        className="click-zone zone-left"
                        onClick={onEnter}
                        title="Entrar con Equipo Carabassa Slice Fockers"
                    />

                    {/* Zona 2: Equipo Carajillos (Derecha) */}
                    <div
                        className="click-zone zone-right"
                        onClick={onEnter}
                        title="Entrar con Equipo Carajillos Voladores"
                    />
                </div>
            </div>
        </div>
    );
}