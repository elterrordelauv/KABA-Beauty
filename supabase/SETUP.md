# Conectar la tienda a Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard).
2. En **SQL Editor**, ejecuta el contenido de `migrations/20261025000000_create_products.sql`.
3. En **Authentication → Users**, crea el usuario de la persona que administrará la tienda. No habilites el registro público de usuarios para esta tienda.
4. Copia el UUID de ese usuario y ejecuta en SQL Editor, reemplazando el valor:

   ```sql
   insert into public.product_admins (user_id)
   values ('UUID-DEL-USUARIO-ADMIN');
   ```

5. Copia `.env.example` como `.env` en la raíz del proyecto. Desde la sección **Connect** de Supabase, completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Completa `VITE_WHATSAPP_NUMBER` con el número del negocio, incluyendo el código de país y solo dígitos (por ejemplo, el prefijo `56` para Chile).
6. Inicia el proyecto con `corepack pnpm dev` y abre `/admin`. Inicia sesión con el usuario creado en el paso 3 para agregar productos.
7. Al publicar el sitio, configura esas mismas tres variables en el proveedor de alojamiento. El archivo `.env` no se debe subir a GitHub.

El administrador permite agregar, editar, publicar, ocultar y eliminar productos. Para mostrar un producto como agotado, edita su stock a `0`; el catálogo público indicará que está agotado. Las imágenes se agregan mediante una URL pública, por lo que puedes alojarlas en Supabase Storage u otro servicio.

El catálogo público solo puede leer productos activos. Las modificaciones requieren que la cuenta esté incluida en `product_admins`; las políticas RLS del SQL aplican esa restricción en la base de datos. La clave publishable puede estar en el frontend porque no sustituye esas políticas. Nunca uses la `service_role` key en la web.

El pedido se prepara en un enlace de WhatsApp. Esta versión no registra pedidos en la base de datos, no procesa pagos y no reserva inventario: disponibilidad, pago y despacho se confirman por WhatsApp.
