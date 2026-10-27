# KABA Beauty

Tienda online de KABA Beauty, construida con React, Vite y Tailwind CSS. El
catálogo y la administración de productos usan Supabase; los pedidos se
coordinan por WhatsApp.

## Estructura del proyecto

- `src/`: aplicación, estilos, cliente de Supabase y recursos visuales.
- `supabase/migrations/`: SQL para crear las tablas, permisos y almacenamiento
  de imágenes.
- `supabase/SETUP.md`: instrucciones para configurar Supabase y las variables
  de entorno.
- `.figma/make/`: configuración y comandos utilizados por Figma Make.
- `index.html`, `vite.config.ts`, `tsconfig.json`: punto de entrada y
  configuración de la aplicación.

## Desarrollo local

Se requiere Node.js 22. En Figma Make se usa pnpm:

```bash
corepack pnpm install
corepack pnpm dev
```

Para comprobar una compilación:

```bash
corepack pnpm build
```

## Publicación

Cloudflare Pages compila el proyecto con `npm run build` y publica el
directorio `dist`. `package-lock.json` mantiene las dependencias de ese flujo;
`pnpm-lock.yaml` mantiene las del entorno Figma Make. Conserva ambos y actualiza
el lockfile del gestor de paquetes que hayas usado al cambiar dependencias.

Configura en el proveedor de publicación las variables indicadas en
`.env.example`. El archivo `.env` local no debe subirse al repositorio.
