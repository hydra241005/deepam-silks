create or replace function public.effective_product_price(
  p_product_id text,
  p_at timestamptz default now()
)
returns table (
  regular_price_minor bigint,
  effective_price_minor bigint,
  discount_minor bigint,
  offer_id uuid
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    p.price_minor,
    case
      when o.id is null then p.price_minor
      else greatest(
        0,
        p.price_minor - case
          when o.discount_type = 'percentage'
            then floor(p.price_minor * o.discount_value / 100)
          else o.discount_value
        end
      )
    end,
    case
      when o.id is null then 0
      else least(
        p.price_minor,
        case
          when o.discount_type = 'percentage'
            then floor(p.price_minor * o.discount_value / 100)
          else o.discount_value
        end
      )
    end,
    o.id
  from public.products p
  left join public.product_discounts pd on pd.product_id = p.id
  left join public.offers o
    on o.id = pd.offer_id
   and o.active
   and p_at >= o.starts_at
   and p_at <= o.ends_at
  where p.id = p_product_id
  order by o.created_at desc nulls last
  limit 1
$$;

grant execute on function public.effective_product_price(text, timestamptz) to anon, authenticated;
