// pins.h — Attribution des GPIO (SAI) — voir README (cablage).
//
// Aligne sur le seed BD (backend) sauf la LDR remplaçant le BH1750 (I2C ->
// ADC) qui passe sur GPIO 36. GP35 est ADC-only (entree) : reserve aux
// capteurs analogiques, jamais en sortie.

#ifndef PINS_H
#define PINS_H

// --- Capteurs ---
#define GPIO_DHT22          4   // temperature / humidite (digital)
#define GPIO_YL69           34  // humidite sol  (analog ADC)
#define GPIO_LDR            36  // photoresistance (analog ADC1, entree pure)
#define GPIO_MQ135          35  // capteur gaz CO2 (analog ADC, ADC-only)
#define GPIO_ULTRASO_TRIG   32  // HC-SR04 trigger (sortie)
#define GPIO_ULTRASO_ECHO   33  // HC-SR04 echo (entree, via diviseur 5V->3.3V)

// --- Actionneurs (relais) ---
#define GPIO_POMPE          26
#define GPIO_VENTILATION    27
#define GPIO_ECLAIRAGE      25

// --- Buzzer alerte ---
#define GPIO_BUZZER          5  // buzzer actif (sortie)

#endif // PINS_H
