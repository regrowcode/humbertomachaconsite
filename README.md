# Humberto Machacón | Asesor Inmobiliario Personal en Málaga

Sitio web editorial de marca personal y asesoría inmobiliaria de lujo para **Humberto Machacón**, especializado en el mercado de **Málaga y Costa del Sol, España**.

Inspirado en la estética *"Quiet Luxury"* de portales de referencia como **Drumelia** (tipografía editorial, fotografía arquitectónica de alto nivel, paleta de colores neutros cálidos y bronce/oro, bilingüe y optimizado para conversión).

---

## 🌟 Características Principales

- **Arquitectura Multi-Página (5 Páginas Independientes):**
  - **Inicio (`/`):** Portada editorial, propuesta de valor, resumen del asesor, adelanto de servicios, enclaves destacados y llamadas a la acción.
  - **Sobre Mí (`/sobre-mi.html`):** Biografía detallada, valores, por qué un asesor personal, testimonios y nota de acreditación profesional.
  - **Servicios (`/servicios.html`):** Los 4 servicios boutique en profundidad, metodología de trabajo en 4 fases y sección de FAQ.
  - **Zonas de Málaga (`/zonas.html`):** Guía visual y de inversión en el Centro Histórico, El Limonar, La Malagueta y Costa del Sol Prime.
  - **Contacto (`/contacto.html`):** Canales directos, WhatsApp oficial y formulario privado de agendamiento.
- **100% Bilingüe (Español / Inglés):** Selector de idioma fluido (`ES | EN`) compartido en todas las páginas con guardado automático en `localStorage`.
- **Cabecera Rediseñada "Quiet Luxury":**
  - Navegación espaciosa y equilibrada de 5 enlaces con indicador visual de página activa.
  - Selector de idioma y botón *"Agendar Cita"* milimétricamente alineados con altura idéntica (34px) y estilo minimalista.
- **Canales de Conversión Inmediata:**
  - Botón directo de **WhatsApp** con saludo personalizado según idioma.
  - Botón flotante de WhatsApp siempre accesible.
  - Formulario de contacto validado.
  - Modales con textos legales redactados conforme a la normativa española y europea (Aviso Legal LSSI-CE, Privacidad RGPD y Política de Cookies).

---

## 🛠️ Cómo Probar en Local

1. Instalar dependencias (ya instaladas en este entorno):
   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

3. Compilar para producción:
   ```bash
   npm run build
   ```

---

## 📸 Cómo Personalizar Fotos, Logo y Textos

El proyecto está diseñado para que cuando tu hermano te envíe su material oficial, sea facilísimo reemplazarlo:

### 1. Reemplazar la foto de Humberto
- Coloca la foto oficial en la carpeta `public/images/` con el nombre `humberto-machacon.jpg` (o cámbiala en `src/config.js`).

### 2. Cambiar datos de contacto y empresa colaboradora
Abre el archivo [src/config.js](file:///c:/Users/HP%20PROBOOK/regrowcode/projects/websites/humbertomachacon/src/config.js):
```javascript
export const siteConfig = {
  advisor: {
    fullName: "Humberto Machacón",
    partnerAgency: "Nombre de la Agencia donde trabaja",
  },
  contact: {
    whatsappNumber: "346XXXXXXXX", // Número internacional sin '+' ni espacios
    phoneDisplay: "+34 6XX XXX XXX",
    email: "tu-correo@tudominio.com",
    calendlyUrl: "https://calendly.com/tu-usuario",
  }
};
```

### 3. Modificar textos o traducciones
Todos los textos en español e inglés están centralizados y ordenados por secciones en [src/translations.js](file:///c:/Users/HP%20PROBOOK/regrowcode/projects/websites/humbertomachacon/src/translations.js).

---

## 🚀 Despliegue en Vercel (Hosting Coste Cero)

Vercel ofrece alojamiento global de alta velocidad, certificado SSL/HTTPS automático y 0 € de coste para este tipo de sitios.

### Opción A (Recomendada: Vía GitHub)
1. Crea un repositorio en GitHub (público o privado) y sube este código:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Humberto Machacon website"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/humbertomachacon.git
   git push -u origin main
   ```
2. Entra en [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
3. Haz clic en **"Add New..." > "Project"** e importa el repositorio `humbertomachacon`.
4. Vercel detectará automáticamente que es un proyecto **Vite**. Haz clic en **"Deploy"**.
5. ¡Listo! En 30 segundos tu web estará en vivo con una URL gratuita tipo `humbertomachacon.vercel.app`.

### Opción B (Directa por terminal)
Ejecuta en la terminal de este proyecto:
```bash
npx vercel
```
Sigue los pasos interactivos de autenticación y despliegue.

---

## 🌐 Conexión del Dominio de Namecheap a Vercel

Una vez desplegado en Vercel:
1. En tu panel de Vercel, ve a: **Settings > Domains**.
2. Añade tu dominio comprado (por ejemplo: `humbertomachacon.com` y `www.humbertomachacon.com`).
3. Vercel te mostrará los registros DNS que necesitas:
   - **Tipo A:** Host `@` apuntando a `76.76.21.21`
   - **Tipo CNAME:** Host `www` apuntando a `cname.vercel-dns.com`
4. Entra en tu cuenta de [Namecheap](https://www.namecheap.com):
   - Ve a **Domain List** > Haz clic en **Manage** al lado de tu dominio.
   - Entra en la pestaña **Advanced DNS**.
   - Añade los registros indicados:
     - **A Record:** Host: `@`, Value: `76.76.21.21`, TTL: `Automatic`
     - **CNAME Record:** Host: `www`, Value: `cname.vercel-dns.com`, TTL: `Automatic`
5. En unos minutos (o hasta un par de horas según propagación DNS), Vercel emitirá el certificado SSL (candado verde HTTPS) automáticamente a coste cero.
