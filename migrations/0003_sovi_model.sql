-- Gateway handshake: persist discovered model id
alter table sovi_settings add column if not exists vps_model text not null default 'sovi';
