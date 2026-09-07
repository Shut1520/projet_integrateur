import React from 'react';
import { ShieldCheck, Headphones } from 'lucide-react';

export default function FieldSection() {
  return (
    <div className="field-section-final">
      <div className="field-layout-final">
        
        <div className="field-copy-final">
          <h2>Conçu pour le terrain, pensé pour demain.</h2>

          <p className="field-description-final">
            SAI combine robustesse matérielle et interface intuitive pour
            accompagner vos cultures, même dans les conditions les plus
            exigeantes.
          </p>

          <div className="field-features-final">

            <div className="field-feature-final">
              <div className="field-feature-icon-final">
                <ShieldCheck size={19} strokeWidth={2} />
              </div>

              <div className="field-feature-content-final">
                <strong>Fiabilité industrielle</strong>
                <span>Matériel testé pour usage extérieur</span>
              </div>
            </div>

            <div className="field-feature-final">
              <div className="field-feature-icon-final">
                <Headphones size={19} strokeWidth={2} />
              </div>

              <div className="field-feature-content-final">
                <strong>Support Expert 24/7</strong>
                <span>Assistance et maintenance dédiée</span>
              </div>
            </div>

          </div>
        </div>

        <div className="field-visual-final">
          <div className="field-image-frame-final">
            <img
              src="/src/assets/landing/image_champs.jpg"
              alt="Exploitation agricole connectée"
            />
          </div>
        </div>

      </div>
    </div>
  );
}