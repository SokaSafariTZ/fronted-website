-- SokaSafari Travel — catalog seed (Tanzania-centric locations, operators, routes).
-- Trips/fares/seats are generated per search date by the app's trip engine
-- (lib/data/trips.ts); for a fully DB-backed deployment, generate trips for a
-- rolling date window via a scheduled edge function using these routes.

-- Locations (airports)
insert into locations (code, name, city, country, country_code, type) values
  ('DAR','Julius Nyerere Intl','Dar es Salaam','Tanzania','TZ','airport'),
  ('JRO','Kilimanjaro Intl','Kilimanjaro','Tanzania','TZ','airport'),
  ('ZNZ','Abeid Amani Karume Intl','Zanzibar','Tanzania','TZ','airport'),
  ('MWZ','Mwanza Airport','Mwanza','Tanzania','TZ','airport'),
  ('ARK','Arusha Airport','Arusha','Tanzania','TZ','airport'),
  ('NBO','Jomo Kenyatta Intl','Nairobi','Kenya','KE','airport'),
  ('EBB','Entebbe Intl','Kampala','Uganda','UG','airport'),
  ('RBA','Bujumbura Intl','Bujumbura','Burundi','BI','airport'),
  ('NIA','Ndjili Intl','Kinshasa','DRC','CD','airport'),
  ('DXB','Dubai Intl','Dubai','UAE','AE','airport'),
  ('CMN','Mohammed V Intl','Casablanca','Morocco','MA','airport'),
  ('LOS','Murtala Muhammed','Lagos','Nigeria','NG','airport')
on conflict (code) do nothing;

-- Locations (bus terminals)
insert into locations (code, name, city, country, country_code, type) values
  ('DAR-BT','Ubungo Bus Terminal','Dar es Salaam','Tanzania','TZ','bus_terminal'),
  ('ARU-BT','Arusha Bus Stand','Arusha','Tanzania','TZ','bus_terminal'),
  ('MOS-BT','Moshi Bus Stand','Moshi','Tanzania','TZ','bus_terminal'),
  ('DOD-BT','Dodoma Bus Terminal','Dodoma','Tanzania','TZ','bus_terminal'),
  ('MWA-BT','Mwanza Bus Stand','Mwanza','Tanzania','TZ','bus_terminal'),
  ('IRI-BT','Iringa Bus Stand','Iringa','Tanzania','TZ','bus_terminal'),
  ('MBY-BT','Mbeya Bus Terminal','Mbeya','Tanzania','TZ','bus_terminal')
on conflict (code) do nothing;

-- Operators (demo: one airline, one bus)
insert into operators (code, name, mode, logo_color, rating) values
  ('TC','Air Tanzania','flights','#1B4F8A',4.2),
  ('DX','Dar Express','buses','#F59E0B',4.0)
on conflict do nothing;
