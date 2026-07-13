-- DEMO reference data. User rows require matching auth.users and are intentionally not created here.
insert into public.roles(code, name, description) values
  ('collaborator','Colaborador','Crea y desarrolla Noticias Maestras'),
  ('editor','Editor','Revisa, solicita cambios, aprueba y publica'),
  ('verifier','Verificador','Revisa afirmaciones y fuentes'),
  ('social','Social media manager','Prepara adaptaciones para redes'),
  ('admin','Administrador','Configura el sistema y permisos'),
  ('director','Dirección editorial','Supervisa operación y estándares')
on conflict (code) do nothing;

insert into public.teams(name) values ('Redacción general'), ('Ciudad'), ('Cultura') on conflict (name) do nothing;
insert into public.categories(name, slug) values
  ('Ciudad','ciudad'),('Política','politica'),('Cultura','cultura'),('Música','musica'),('Economía','economia'),('Tecnología','tecnologia')
on conflict (slug) do nothing;
