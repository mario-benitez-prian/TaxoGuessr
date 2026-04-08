  //
  // App style
  //

  export const appStyles = `:root {
    --bg: #f8fafc;
    --card: #ffffff;
    --accent: #0b5b37;
    --secondary: #fcde6c;
    --green-med: #7aa863;
    --green-light: #b9d26e;
    --green-lime: #eaee95;
    --muted: #64748b;
    --text-dark: #1e293b;
    --border: #e2e8f0;
  }
  .wrap{max-width:720px;margin:18px auto;padding:12px;font-family:Inter,system-ui,Segoe UI,Helvetica,Arial,sans-serif;color:var(--text-dark)}
  .card{background:var(--card);border-radius:18px;box-shadow:0 10px 25px rgba(11, 91, 55, 0.08);padding:20px;border: 1px solid var(--border)}
  header{display:flex;align-items:center;gap:12px;margin-bottom:12px}
  h1{font-size:18px;margin:0}
  .meta{color:var(--muted);font-size:13px}
  .image{width:100%;height:220px;border-radius:10px;overflow:hidden;background:linear-gradient(180deg,#e6f0ff,#fff);display:flex;align-items:center;justify-content:center}
  img{width:100%;height:100%;object-fit:cover}
  label{font-size:12px;color:var(--muted);display:block;margin-bottom:6px}
  input{width:100%;padding:10px;border-radius:8px;border:1px solid #e6e9ef;font-size:14px}
  .row{display:flex;gap:8px;margin-top:8px}
  .col{flex:1}
  .controls{display:flex;gap:8px;margin-top:6px}
  input.input-correct {
    border-color: #34d399; /* verde */
    box-shadow: inset 0 0 0 6px rgba(52,211,153,0.08);
    transition: box-shadow 180ms, border-color 180ms;
  }
  input.input-wrong {
    border-color: #f87171; /* rojo */
    box-shadow: inset 0 0 0 6px rgba(248,113,113,0.08);
    transition: box-shadow 180ms, border-color 180ms;
  }
  button{background:var(--accent);color:white;border:0;padding:10px 14px;border-radius:10px;font-weight:600}
  .ghost{background:transparent;color:var(--accent);border:1px solid rgba(59,130,246,0.12)}
  .small{font-size:13px;color:var(--muted)}
  .top-right{position:absolute;right:18px;top:18px;display:flex;gap:8px}
  .progress-row{display:flex;align-items:center;gap:12px;margin:8px 0}
  .progress-bar{flex:1;height:12px;background:#eef6ff;border-radius:999px;overflow:hidden}
  .progress-fill{height:100%;background:var(--accent)}
  .species-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f1f5f9}
  .species-left{display:flex;gap:12px;align-items:center}
  .small-muted{font-size:12px;color:#94a3b8}
   /* resaltado suave para inputs tras enviar respuesta */
  /* pequeño progreso para cada especie */
  .progress-mini {
    width: 80px;
    height: 6px;
    border-radius: 4px;
    background: #e2e8f0;
    overflow: hidden;
  }
  .progress-mini-fill {
    height: 100%;
    background: rgba(58, 105, 99, 0.9);
    transition: width 0.25s;
  }

  .card-mini {
  margin-bottom: 12px;
  padding: 12px 14px;
  background: rgb(251, 253, 255);
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cgi-title {
  font-size: 14px;
  color: #334155;
  margin-bottom: 6px;
}

.cgi-progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cgi-progress-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.cgi-progress-bar-fill {
  height: 100%;
  background: rgba(58, 105, 99, 0.9);
  transition: width 0.25s;
}

.cgi-progress-text {
  font-size: 13px;
  color: #334155;
  font-weight: 600;
}

.achievements-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  width: 100%;
  box-sizing: border-box;
}

.achievement {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  /* Ajustes que evitan solapamiento */
  width: 100%;           /* ocupa la columna completa */
  max-width: 100%;       /* nunca se salga del grid */
  box-sizing: border-box;
  padding: 12px;
  border-radius: 12px;
  background: #f4f6fa;

  /* Flex permite que el contenido se adapte */
  flex-shrink: 1;
}

/* Overlay con efecto blur */
.achievement-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);

  /* Ligero tinte para mejorar contraste */
  background-color: rgba(255, 255, 255, 0.08);
}

/* Caja del popup */
.achievement-modal {
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  max-width: 420px;
  width: 80%;
  text-align: center;

  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}

/* Imagen del logro */
.achievement-image {
  width: 100%;      /* ocupa todo el ancho disponible */
  height: auto;     /* mantiene proporción */
  max-width: 56px;  /* opcional, limita tamaño de la imagen */
  object-fit: contain;
  margin-bottom: 8px;
}

/* Texto */
.achievement-description {
  color: black;
  font-size: 16px;
  font-weight: 700;
}

.achievement-info {
  color: #374151;
}

/* Botonera */
.achievement-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
}

/* Animación opcional de entrada */
.achievement-overlay {
  animation: achievementFadeIn 0.3s ease-out;
}

.achievement-modal {
  animation: achievementModalIn 0.25s ease-out;
}

@keyframes achievementFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Overlay del popup Wikipedia */
.wiki-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0,0,0,0.4);
  z-index: 9999;
  padding: 16px;
  box-sizing: border-box;
}

/* Caja del popup */
.wiki-popup-content {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

/* Botón cerrar */
.wiki-popup-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  color: #333;
}

/* Imagen del popup */
.wiki-popup-image {
  width: 100%;
  margin-top: 12px;
  border-radius: 8px;
}

/* Título del popup */
.wiki-popup-title {
  margin-top: 0;
}

.wiki-popup-link {
  display: inline-block;
  margin-top: 12px;
  color: #1d4ed8; /* azul */
  text-decoration: underline;
  font-weight: 500;
  cursor: pointer;
}


  `;