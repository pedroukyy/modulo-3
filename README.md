# ☁️ Arquitectura Cloud: Sistema de Acortador de URLs

**Desarrollado por:** Andrés Cadenas  
 
**Estado:** 🚀 Desplegado y Operativo

---

## 📖 Descripción del Proyecto

Este proyecto es una solución completa **Serverless** para acortar enlaces, redirigir tráfico y analizar estadísticas en tiempo real. Fue diseñado siguiendo una arquitectura de microservicios en **AWS**, utilizando **Terraform** para la Infraestructura como Código (IaC) y **GitHub Actions** para CI/CD.

El sistema permite:
1.  **Acortar URLs:** Convertir enlaces largos en códigos cortos únicos.
2.  **Redirección Inteligente:** Redirigir al usuario al destino original en segundos.
3.  **Conteo de Visitas (Atomic):** Registrar cada clic en tiempo real directamente en la base de datos.
4.  **Analítica:** Visualizar gráficos de tráfico histórico y contadores totales.

---

## 🏗️ Arquitectura del Sistema

El sistema está dividido en **Módulos** independientes que se comunican entre sí:

### 🧩 Módulo 1: API de Creación (Backend)
* **Función:** Recibe una URL larga y genera un código corto único (ej: `7f571b8`).
* **Tecnología:** AWS Lambda (Node.js) + API Gateway.
* **Base de Datos:** Escribe en **DynamoDB** (`Tabla1`).

### 🧩 Módulo 3: API de Gestión y Redirección (Backend)
* **Función:**
    * Consulta la base de datos compartida (`Tabla1`) para encontrar el destino.
    * **Actualiza el contador de visitas** (+1) de forma atómica.
    * Registra el **timestamp** de la visita para el historial.
    * Devuelve los datos para la redirección y las estadísticas.
* **Tecnología:** AWS Lambda (Node.js) + API Gateway.
* **Permisos:** IAM Roles con acceso `GetItem` y `UpdateItem` a DynamoDB.

### 🧩 Módulo 5: Cliente Principal (Frontend)
* **Función:** Interfaz de usuario para crear links y manejar la redirección.
* **Router:**
    * `/`: Formulario para acortar links.
    * `/short/:codigo`: Pantalla de espera ("Redirigiendo...") que ejecuta la lógica de visita.
* **Tecnología:** React + Vite + React Router.
* **Hosting:** AWS S3 + CloudFront (CDN Global).

### 🧩 Módulo 4: Dashboard de Estadísticas (Frontend)
* **Función:** Panel de control para ver el rendimiento de un enlace.
* **Visualización:** Gráficos de barras (Recharts) y tablas de historial.
* **Tecnología:** React + Recharts.
* **Hosting:** AWS S3 + CloudFront.

---

## 🛠️ Tecnologías Utilizadas

| Categoría | Herramientas |
| :--- | :--- |
| **Cloud Provider** | AWS (Amazon Web Services) |
| **Compute** | AWS Lambda (Node.js 18.x) |
| **API Management** | AWS API Gateway (HTTP API) |
| **Database** | Amazon DynamoDB (NoSQL) |
| **Frontend Hosting** | Amazon S3 + CloudFront |
| **Frontend Framework** | React.js (Vite) |
| **Infraestructura** | Terraform (HCL) |
| **CI/CD** | GitHub Actions |

---

## 🚀 Despliegue e Instalación

### Prerrequisitos
* Cuenta de AWS con credenciales configuradas.
* Terraform instalado.
* Node.js y NPM instalados.

### 1. Desplegar Infraestructura (Backend)
Cada módulo tiene su carpeta `terraform`. Para desplegar:

```bash
cd parcial-modulo-3/terraform
terraform init
terraform apply -auto-approve
2. Ejecutar Frontend Localmente
Para probar la interfaz de usuario:

Bash

cd parcial-modulo-5/frontend
npm install
npm run dev
🔗 Endpoints de la API
1. Crear Link Corto (Módulo 1)
POST /shorten

JSON

{
  "url": "[https://www.google.com](https://www.google.com)"
}
2. Obtener Datos y Redirigir (Módulo 3)
GET /stats/{codigo}

Respuesta:

JSON

{
  "codigo": "7f571b8",
  "urlOriginal": "[https://www.google.com](https://www.google.com)",
  "totalVisitas": 15,
  "historial": ["2025-11-28T14:00...", "2025-11-28T15:00..."]
}