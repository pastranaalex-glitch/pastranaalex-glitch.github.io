-- Solo guardamos el hash de un ID aleatorio de navegador, nunca nombres ni correos.
CREATE TABLE IF NOT EXISTS valoraciones (
  app_slug TEXT NOT NULL,
  visitante TEXT NOT NULL,
  estrellas INTEGER NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  actualizado TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (app_slug, visitante)
);
CREATE TABLE IF NOT EXISTS limite_hora (
  hora INTEGER NOT NULL,
  clave TEXT NOT NULL,
  intentos INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (hora, clave)
);
