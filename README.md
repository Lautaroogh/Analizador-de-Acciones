# FinAnalyzer (Analizador de Acciones)

FinAnalyzer es una plataforma integral de análisis financiero diseñada para proporcionar información detallada sobre acciones y ETFs. Combina un backend robusto en Python (FastAPI) con una interfaz de usuario moderna en React, ofreciendo herramientas para análisis técnico, fundamental y estadístico.

## 🚀 Características Principales

*   **Búsqueda en Tiempo Real**: Encuentra acciones y ETFs utilizando la API de Yahoo Finance.
*   **Gráficos Interactivos**: Visualiza el precio histórico con gráficos de velas y líneas interactivos.
*   **Análisis Técnico**: Indicadores avanzados calculados automáticamente.
*   **Datos Fundamentales**: Acceso a ratios financieros y resúmenes de empresas (traducidos al español).
*   **Análisis Estadístico**:
    *   Heatmap de retornos mensuales (Estacionalidad).
    *   Distribución de retornos.
    *   Análisis de Drawdowns (caídas máximas).
*   **Interfaz Moderna**: Diseño responsivo con modo oscuro/claro y pestañas intuitivas.

## 🛠️ Tecnologías Utilizadas

**Backend**
*   Python 3.x
*   **FastAPI**: API REST de alto rendimiento.
*   **YFinance**: Extracción de datos financieros.
*   **Pandas & NumPy**: Procesamiento y análisis de datos.
*   **TA-Lib / scikit-learn**: Cálculos técnicos y estadísticos.

**Frontend**
*   **React** (Vite): Framework de UI rápido y ligero.
*   **TailwindCSS**: Estilizado moderno y responsivo.
*   **Recharts**: Librería de visualización de datos.
*   **Framer Motion**: Animaciones fluidas.

## 📋 Requisitos Previos

Asegúrate de tener instalados los siguientes componentes en tu sistema:
*   [Node.js](https://nodejs.org/) (v16 o superior)
*   [Python](https://www.python.org/) (v3.9 o superior)
*   Git

## 🔧 Instalación y Configuración Local

Sigue estos pasos para clonar y ejecutar el proyecto en tu máquina local:

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Lautaroogh/Analizador-de-Acciones.git
cd Analizador-de-Acciones
```

### 2. Configurar el Backend

Navega a la carpeta del backend e instala las dependencias:

```bash
cd backend
# Crear un entorno virtual (recomendado)
python -m venv venv
# Activar entorno virtual
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
cd ..
```

### 3. Configurar el Frontend

Navega a la carpeta del frontend e instala las librerías:

```bash
cd frontend
npm install
cd ..
```

## ▶️ Cómo Ejecutar

### Opción A: Script Automático (Windows)

Simplemente ejecuta el archivo `RUN_APP.bat` que se encuentra en la raíz del proyecto. Este script:
1.  Iniciará el servidor Backend.
2.  Iniciará el servidor Frontend.
3.  Abrirá automáticamente tu navegador en `http://localhost:5173`.

### Opción B: Ejecución Manual

**Terminal 1 (Backend):**
```bash
cd backend
python main.py
# El servidor correrá en http://localhost:8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# La aplicación correrá en http://localhost:5173
```

## ⚠️ Disclaimer

Este proyecto fue desarrollado con fines **estrictamente educativos**. La información proporcionada por la aplicación no constituye asesoramiento financiero. Las decisiones de inversión deben basarse en su propia investigación y análisis.

## 📄 Licencia

Este proyecto está bajo la licencia MIT.
