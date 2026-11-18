drop policy if exists "read cfg" on public.app_config;
create policy "read member cfg" on public.app_config for select to authenticated
  using (key in ('offer_text','prices_checked_on','recharge_checked_on','custom_min','custom_max'));
revoke select on public.app_config from anon;

drop policy if exists "product images read" on storage.objects;
create policy "product images read" on storage.objects for select to authenticated
  using (
    bucket_id = 'product-images'
    and (
      public.has_role(auth.uid(), 'admin')
      or exists (select 1 from public.products p where p.enabled and p.image_url = 'storage:' || storage.objects.name)
    )
  );