create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null,
  price integer not null check (price > 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.product_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.products enable row level security;
alter table public.product_admins enable row level security;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.product_admins to authenticated;

create policy "Anyone can view active products"
  on public.products for select
  to anon
  using (active = true);

create policy "Signed-in users can view active products and admins can view all"
  on public.products for select
  to authenticated
  using (
    active = true
    or exists (
      select 1
      from public.product_admins
      where product_admins.user_id = (select auth.uid())
    )
  );

create policy "Product admins can add products"
  on public.products for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.product_admins
      where product_admins.user_id = (select auth.uid())
    )
  );

create policy "Product admins can update products"
  on public.products for update
  to authenticated
  using (
    exists (
      select 1
      from public.product_admins
      where product_admins.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.product_admins
      where product_admins.user_id = (select auth.uid())
    )
  );

create policy "Product admins can delete products"
  on public.products for delete
  to authenticated
  using (
    exists (
      select 1
      from public.product_admins
      where product_admins.user_id = (select auth.uid())
    )
  );

create policy "Admins can view their own admin record"
  on public.product_admins for select
  to authenticated
  using (user_id = (select auth.uid()));
