# 🏆 Gestor de Torneos / Campeonatos

Una aplicación web moderna, intuitiva y responsive diseñada para organizar, administrar y realizar el seguimiento de torneos y campeonatos estilo Round-Robin (todos contra todos) en tiempo real.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 🚀 Características Principales

- **📊 Dashboard Interactivo:** Métricas globales del sistema (torneos, jugadores, partidas) y resumen de progreso en tiempo real del torneo activo.
- **🏆 Gestión de Torneos Multigrupo:** Crea, renombra, personaliza banners (URLs) y cambia entre diferentes torneos activamente.
- **👥 Administración de Jugadores:** Añade participantes con foto de perfil personalizada (URL) y edítalos en cualquier momento.
- **⚡ Generación Automática de Calendarios:** Algoritmo Round-Robin para emparejamientos por jornadas completas con gestión automática de descansos cuando el número de participantes es impar.
- **🎮 Registro de Resultados:** Actualización inmediata de resultados (Victoria/Empate/Derrota) con cálculo dinámico de puntuación en la tabla de clasificación.
- **🔍 Buscador en Tiempo Real:** Filtra enfrentamientos o jornadas rápidamente por el nombre de cualquier jugador.
- **💾 Persistencia de Datos & Respaldos:** 
  - Almacenamiento local mediante `localStorage`.
  - Exportación e importación de copias de seguridad en formato `.json`.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3 (Modern Flexbox/Grid, Variables CSS, Glassmorphism, Responsive Design), JavaScript (Vanilla JS ES6+).
- **Tipografía e Iconos:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) y [Font Awesome 6](https://fontawesome.com/).
- **Almacenamiento:** API Web `localStorage` y procesamiento de archivos local mediante `FileReader`.

---

## 💻 Instalación y Uso Local

No requiere de compilación ni servidores complejos. Puedes ejecutar el proyecto directamente en cualquier navegador web moderno.

1. **Clona el repositorio:**
   ```bash
   git clone [https://github.com/tu-usuario/gestor-de-torneos.git](https://github.com/tu-usuario/gestor-de-torneos.git)