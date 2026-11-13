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

Después de la migración de productos, ejecuta también `migrations/20261025010000_product_image_storage.sql` en **SQL Editor** para crear el almacenamiento de fotos. Si ya ejecutaste la primera migración, no la vuelvas a ejecutar; ejecuta solo la nueva migración de imágenes.

Ejecuta también `migrations/20261112000000_product_image_gallery.sql` para habilitar varias fotos por producto. La migración conserva y copia la foto existente como primera imagen; después de ejecutarla, el administrador permite agregar o quitar fotos de la galería. Las fotos se eliminan de Storage al borrar el producto o al quitarlas y guardar los cambios.

El administrador permite agregar, editar, publicar, ocultar y eliminar productos. Para mostrar un producto como agotado, edita su stock a `0` o usa el botón **Marcar agotado**; el catálogo público indicará que está agotado. En el formulario puedes arrastrar varias fotos al área indicada o seleccionarlas desde tu computador. Se aceptan JPG, PNG y WebP de hasta 5 MB cada una. El administrador sube las imágenes a Supabase Storage al guardar el producto, así que no es necesario abrir Supabase para administrar imágenes. Solo hay que configurar Storage una vez ejecutando la migración adicional.

El catálogo público solo puede leer productos activos y ver las fotos públicas de productos. Las modificaciones y cargas de imágenes requieren que la cuenta esté incluida en `product_admins`; las políticas RLS aplican esa restricción en la base de datos y el almacenamiento. La clave publishable puede estar en el frontend porque no sustituye esas políticas. Nunca uses la `service_role` key en la web.

El pedido se prepara en un enlace de WhatsApp. Esta versión no registra pedidos en la base de datos, no procesa pagos y no reserva inventario: disponibilidad, pago y despacho se confirman por WhatsApp.
