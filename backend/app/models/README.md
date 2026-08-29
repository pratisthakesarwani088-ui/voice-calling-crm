# models/

SQLAlchemy ORM models, one file per entity, plus shared support files:
`base.py` (id/timestamps/soft-delete mixins), `enums.py` (shared enum
types + the `sa_enum()` helper).

| File | Table | Notes |
|---|---|---|
| `user.py` | `users` | soft-delete enabled |
| `customer.py` | `customers` | soft-delete enabled; unique phone/code |
| `product.py` | `products` | soft-delete enabled; unique SKU/code (Module 6) |
| `knowledge_base.py` | `knowledge_base` | soft-delete enabled; linked to a product (Module 6) |
| `call.py` | `calls` | belongs to a customer; audit trail; extended in Module 9
  with `mode`, `product_id`, `external_call_id`; soft-delete added in
  Module 10 |
| `follow_up.py` | `follow_ups` | belongs to a customer |
| `report.py` | `reports` | optionally references the generating user |

Every model must be imported in `__init__.py` so it registers on
`Base.metadata`.
